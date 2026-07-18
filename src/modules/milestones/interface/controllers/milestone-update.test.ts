import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import request from "supertest";
import type { Express } from "express";
import { prisma } from "@/prisma.js";
import { clearDatabase } from "../../../../../tests/helpers.js";
import {
  buildMilestonesTestApp,
  defaultController,
  primeSession,
  seedProjectWithMember,
  seedUser,
} from "@milestones/test-utils/test-app.js";

/**
 * End-to-end tests for PATCH /api/projects/:projectId/milestones/:milestoneId.
 *
 * Mirrors the architecture of milestone-create.test.ts and milestone-list.test.ts:
 * the full middleware chain is exercised against a real SQLite DB and the
 * global error handler. Cookie sessions are forged via the test-only
 * /api/test/prime-session route (do not ship to prod).
 *
 * RED proof (history): the file lands BEFORE the UpdateMilestone use case +
 * controller.update method + PATCH route registration. Tests fail with 404
 * (route not registered) or 500 (no handler). The GREEN commit wires the
 * full cluster, including a status-transition gate via MilestoneStatusTransitions.
 */
describe("PATCH /api/projects/:projectId/milestones/:milestoneId (update)", () => {
  let app: Express;
  const OWNER = { email: "owner-milestones-update@test.com", name: "Update Owner" };
  const OUTSIDER = {
    email: "outsider-milestones-update@test.com",
    name: "Update Outsider",
  };
  const OTHER_OWNER = {
    email: "other-owner-milestones-update@test.com",
    name: "Update Other Owner",
  };
  let ownerUserId: string;
  let outsiderUserId: string;
  let otherProjectOwnerUserId: string;
  let ownerCookies: string;
  let outsiderCookies: string;
  let otherOwnerCookies: string;
  let projectId: string;
  let milestoneId: string;

  beforeAll(() => {
    app = buildMilestonesTestApp(
      defaultController(),
      "sessions-milestones-update.db",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerUserId = await seedUser(OWNER.email, OWNER.name);
    outsiderUserId = await seedUser(OUTSIDER.email, OUTSIDER.name);
    otherProjectOwnerUserId = await seedUser(OTHER_OWNER.email, OTHER_OWNER.name);
    projectId = await seedProjectWithMember(ownerUserId, "Update Project");
    ownerCookies = await primeSession(app, ownerUserId);
    outsiderCookies = await primeSession(app, outsiderUserId);
    otherOwnerCookies = await primeSession(app, otherProjectOwnerUserId);

    // Seed a milestone owned by the `projectId` project.
    const created = await prisma.milestone.create({
      data: {
        projectId,
        name: "Original Title",
        description: "Original description",
        targetDate: new Date("2026-06-01T00:00:00.000Z"),
        status: "open",
      },
    });
    milestoneId = created.id;
  });

  describe("happy path", () => {
    it("returns 200 with the updated milestone body when title changes", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ title: "New Title" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: milestoneId,
        projectId,
        title: "New Title",
        description: "Original description",
        dueDate: "2026-06-01T00:00:00.000Z",
        status: "open",
      });
    });

    it("returns 200 with no-op when same name and same status are sent", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ title: "Original Title" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Original Title");
      expect(res.body.status).toBe("open");
    });

    it("persists status transitions open -> closed in the database", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ status: "closed" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("closed");

      const fromDb = await prisma.milestone.findUnique({
        where: { id: milestoneId },
      });
      expect(fromDb?.status).toBe("closed");
    });

    it("allows updating multiple fields at once", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({
          title: "Multi update",
          description: "Updated description",
          dueDate: "2027-01-01T00:00:00.000Z",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        title: "Multi update",
        description: "Updated description",
        dueDate: "2027-01-01T00:00:00.000Z",
        status: "open",
      });
    });

    it("normalises legacy PLANNED status on the way out (status is returned as open)", async () => {
      // Force the DB row back to the legacy "PLANNED" value to confirm the
      // DTO mapper normalises it.
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: { status: "PLANNED" },
      });

      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ title: "Renamed" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("open");
      expect(res.body.title).toBe("Renamed");
    });
  });

  describe("validation failures (400)", () => {
    it("rejects an empty title with 400", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ title: "" });
      expect(res.status).toBe(400);
    });

    it("rejects a title longer than 120 characters with 400", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ title: "x".repeat(121) });
      expect(res.status).toBe(400);
    });

    it("rejects a malformed dueDate with 400", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ dueDate: "not-a-date" });
      expect(res.status).toBe(400);
    });

    it("rejects an unknown status value with 400", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ status: "COMPLETED" });
      expect(res.status).toBe(400);
    });

    it("accepts an empty body (no fields) without erroring", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({});
      // No-op when nothing changes; the controller path still hits 200.
      expect(res.status).toBe(200);
    });
  });

  describe("authorization failures", () => {
    it("returns 403 when the actor is not a ProjectMember", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", outsiderCookies)
        .send({ title: "Sneaky" });
      expect(res.status).toBe(403);
    });

    it("returns 401 when no session cookie is provided", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .send({ title: "Anon" });
      expect(res.status).toBe(401);
    });

    it("returns 404 when the project does not exist", async () => {
      const res = await request(app)
        .patch(
          `/api/projects/does-not-exist-id/milestones/${milestoneId}`,
        )
        .set("Cookie", ownerCookies)
        .send({ title: "Ghost" });
      expect(res.status).toBe(404);
    });

    it("returns 404 when the milestone exists but belongs to a different project (cross-project isolation)", async () => {
      // The OTHER owner has its own project, but its cookies are valid
      // and not a member of *our* project. The membership guard returns
      // 403 BEFORE the milestone lookup, so the cross-project scenario
      // looks like a 403 to an authenticated outsider.
      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", otherOwnerCookies)
        .send({ title: "Cross-project" });
      expect(res.status).toBe(403);
    });
  });

  describe("not found (404)", () => {
    it("returns 404 when the milestone id is unknown", async () => {
      const res = await request(app)
        .patch(
          `/api/projects/${projectId}/milestones/does-not-exist-id`,
        )
        .set("Cookie", ownerCookies)
        .send({ title: "Phantom" });
      expect(res.status).toBe(404);
    });
  });

  describe("illegal status transitions (409)", () => {
    it("returns 409 when trying to reopen an archived milestone (archived -> open)", async () => {
      // Pre-seed a milestone already in the archived state.
      const archived = await prisma.milestone.create({
        data: {
          projectId,
          name: "Already archived",
          status: "archived",
        },
      });

      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${archived.id}`)
        .set("Cookie", ownerCookies)
        .send({ status: "open" });

      expect(res.status).toBe(409);
    });

    it("returns 409 when trying to unarchive an archived milestone (archived -> closed)", async () => {
      const archived = await prisma.milestone.create({
        data: {
          projectId,
          name: "Also archived",
          status: "archived",
        },
      });

      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${archived.id}`)
        .set("Cookie", ownerCookies)
        .send({ status: "closed" });

      expect(res.status).toBe(409);
    });

    it("returns 409 when trying to reopen a closed milestone (closed -> open)", async () => {
      // First close the seeded milestone via PATCH.
      await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ status: "closed" });

      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ status: "open" });

      expect(res.status).toBe(409);
    });

    it("allows the no-op transition closed -> closed with 200", async () => {
      await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ status: "closed" });

      const res = await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ status: "closed" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("closed");
    });
  });
});
