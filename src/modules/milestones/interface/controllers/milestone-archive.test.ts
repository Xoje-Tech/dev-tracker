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
 * End-to-end tests for POST /api/projects/:projectId/milestones/:milestoneId/archive.
 *
 * Soft delete. Per the spec, archive = set status to "archived" (no new
 * column). The Prisma schema (PR A) has no archivedAt, so the soft-delete
 * signal rides in the status column. The default list view excludes
 * archived milestones; passing ?includeArchived=true returns them all.
 *
 * RED proof: file lands BEFORE ArchiveMilestone + archive route are wired.
 * Archive-specific tests fail with 404 (no archive route registered). The
 * list-with-includeArchived tests fail with 404 too, but those tests
 * double as coverage for the controller's query-param alias added in
 * this cluster.
 */
describe("POST /api/projects/:projectId/milestones/:milestoneId/archive", () => {
  let app: Express;
  const OWNER = {
    email: "owner-milestones-archive@test.com",
    name: "Archive Owner",
  };
  const OUTSIDER = {
    email: "outsider-milestones-archive@test.com",
    name: "Archive Outsider",
  };
  let ownerUserId: string;
  let outsiderUserId: string;
  let ownerCookies: string;
  let outsiderCookies: string;
  let projectId: string;
  let milestoneId: string;

  beforeAll(() => {
    app = buildMilestonesTestApp(
      defaultController(),
      "sessions-milestones-archive.db",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerUserId = await seedUser(OWNER.email, OWNER.name);
    outsiderUserId = await seedUser(OUTSIDER.email, OUTSIDER.name);
    projectId = await seedProjectWithMember(ownerUserId, "Archive Project");
    ownerCookies = await primeSession(app, ownerUserId);
    outsiderCookies = await primeSession(app, outsiderUserId);

    const created = await prisma.milestone.create({
      data: {
        projectId,
        name: "Live milestone",
        status: "open",
      },
    });
    milestoneId = created.id;
  });

  describe("happy path", () => {
    it("returns 200 with the archived milestone body showing status=archived", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones/${milestoneId}/archive`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: milestoneId,
        projectId,
        title: "Live milestone",
        status: "archived",
      });
      expect(res.body.updatedAt).toBeTruthy();
    });

    it("persists the status change to the database", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones/${milestoneId}/archive`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      const fromDb = await prisma.milestone.findUnique({
        where: { id: milestoneId },
      });
      expect(fromDb?.status).toBe("archived");
    });

    it("archives a milestone whose current status is closed (closed -> archived is legal)", async () => {
      // First close the milestone via PATCH, then archive.
      await request(app)
        .patch(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies)
        .send({ status: "closed" });

      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones/${milestoneId}/archive`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("archived");
    });

    it("excludes the archived milestone from the default list", async () => {
      // Archive it.
      const archived = await prisma.milestone.create({
        data: { projectId, name: "To archive", status: "open" },
      });
      await request(app)
        .post(`/api/projects/${projectId}/milestones/${archived.id}/archive`)
        .set("Cookie", ownerCookies)
        .expect(200);

      // The live milestone (milestoneId) should still be visible; the
      // archived one should NOT.
      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      const ids = res.body.map((m: { id: string }) => m.id);
      expect(ids).toContain(milestoneId);
      expect(ids).not.toContain(archived.id);
    });

    it("includes the archived milestone when the list is called with ?includeArchived=true", async () => {
      const archived = await prisma.milestone.create({
        data: { projectId, name: "To archive for includes", status: "open" },
      });
      await request(app)
        .post(`/api/projects/${projectId}/milestones/${archived.id}/archive`)
        .set("Cookie", ownerCookies)
        .expect(200);

      const res = await request(app)
        .get(
          `/api/projects/${projectId}/milestones?includeArchived=true`,
        )
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      const ids = res.body.map((m: { id: string }) => m.id);
      expect(ids).toContain(milestoneId);
      expect(ids).toContain(archived.id);
    });

    it("also accepts ?archived=true (backwards-compatible alias of includeArchived)", async () => {
      // The legacy ?archived=true alias already exists in the controller;
      // the new ?includeArchived=true is the canonical name. Both must work.
      const archived = await prisma.milestone.create({
        data: { projectId, name: "Legacy alias test", status: "open" },
      });
      await request(app)
        .post(`/api/projects/${projectId}/milestones/${archived.id}/archive`)
        .set("Cookie", ownerCookies)
        .expect(200);

      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones?archived=true`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      const ids = res.body.map((m: { id: string }) => m.id);
      expect(ids).toContain(archived.id);
    });
  });

  describe("authorization failures", () => {
    it("returns 403 when the actor is not a ProjectMember", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones/${milestoneId}/archive`)
        .set("Cookie", outsiderCookies);

      expect(res.status).toBe(403);
      // Side-effect check: outsider must not have archived the milestone.
      const stillLive = await prisma.milestone.findUnique({
        where: { id: milestoneId },
      });
      expect(stillLive?.status).toBe("open");
    });

    it("returns 401 when no session cookie is provided", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones/${milestoneId}/archive`);

      expect(res.status).toBe(401);
    });

    it("returns 404 when the project does not exist", async () => {
      const res = await request(app)
        .post(
          `/api/projects/does-not-exist-id/milestones/${milestoneId}/archive`,
        )
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });

  describe("not found / edge cases (404, 409)", () => {
    it("returns 404 when the milestone id is unknown", async () => {
      const res = await request(app)
        .post(
          `/api/projects/${projectId}/milestones/does-not-exist-id/archive`,
        )
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });

    it("returns 409 (illegal transition) when archiving an already-archived milestone is NOT a no-op for status open->archived (second archive)", async () => {
      // First archive succeeds.
      await request(app)
        .post(`/api/projects/${projectId}/milestones/${milestoneId}/archive`)
        .set("Cookie", ownerCookies)
        .expect(200);

      // Second archive on the same milestone: archived -> archived is a no-op
      // via MilestoneStatusTransitions (same->same), so 200 is expected.
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones/${milestoneId}/archive`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("archived");
    });
  });
});
