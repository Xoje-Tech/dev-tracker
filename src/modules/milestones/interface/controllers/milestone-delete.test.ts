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
 * End-to-end tests for DELETE /api/projects/:projectId/milestones/:milestoneId.
 *
 * Hard delete. Per the schema (PR A) Sprint.milestoneId has onDelete: SetNull,
 * so any Sprint that pointed at the deleted milestone should now have
 * milestoneId = null. That contract is the most important thing under test
 * here — losing the FK to a parent milestone must not orphan sprints.
 *
 * RED proof: file lands BEFORE DeleteMilestone + DELETE route are wired.
 * Tests fail with 404 (route not registered).
 */
describe("DELETE /api/projects/:projectId/milestones/:milestoneId (delete)", () => {
  let app: Express;
  const OWNER = { email: "owner-milestones-delete@test.com", name: "Delete Owner" };
  const OUTSIDER = {
    email: "outsider-milestones-delete@test.com",
    name: "Delete Outsider",
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
      "sessions-milestones-delete.db",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerUserId = await seedUser(OWNER.email, OWNER.name);
    outsiderUserId = await seedUser(OUTSIDER.email, OUTSIDER.name);
    projectId = await seedProjectWithMember(ownerUserId, "Delete Project");
    ownerCookies = await primeSession(app, ownerUserId);
    outsiderCookies = await primeSession(app, outsiderUserId);

    const created = await prisma.milestone.create({
      data: {
        projectId,
        name: "To be deleted",
        status: "open",
      },
    });
    milestoneId = created.id;
  });

  describe("happy path", () => {
    it("returns 204 on successful delete and removes the row", async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(204);
      // 204 must not send a body.
      expect(res.body).toEqual({});
      expect(res.text).toBe("");

      const fromDb = await prisma.milestone.findUnique({
        where: { id: milestoneId },
      });
      expect(fromDb).toBeNull();
    });

    it("does not delete a sibling milestone", async () => {
      const sibling = await prisma.milestone.create({
        data: { projectId, name: "Sibling", status: "open" },
      });

      const res = await request(app)
        .delete(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(204);
      const siblingStill = await prisma.milestone.findUnique({
        where: { id: sibling.id },
      });
      expect(siblingStill).not.toBeNull();
    });

    it("nulls out Sprint.milestoneId on referencing sprints (FK SetNull semantics)", async () => {
      // Create a sprint that references the milestone.
      const sprint = await prisma.sprint.create({
        data: {
          projectId,
          milestoneId,
          name: "Blocked-by-deleted",
        },
      });

      const res = await request(app)
        .delete(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(204);

      // The sprint should still exist, with milestoneId = null.
      const after = await prisma.sprint.findUnique({
        where: { id: sprint.id },
      });
      expect(after).not.toBeNull();
      expect(after?.milestoneId).toBeNull();
      expect(after?.name).toBe("Blocked-by-deleted");
    });
  });

  describe("authorization failures", () => {
    it("returns 403 when the actor is not a ProjectMember", async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", outsiderCookies);

      expect(res.status).toBe(403);

      // Side-effect check: outsider must not have deleted the milestone.
      const stillThere = await prisma.milestone.findUnique({
        where: { id: milestoneId },
      });
      expect(stillThere).not.toBeNull();
    });

    it("returns 401 when no session cookie is provided", async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}/milestones/${milestoneId}`);

      expect(res.status).toBe(401);
    });

    it("returns 404 when the project does not exist", async () => {
      const res = await request(app)
        .delete(
          `/api/projects/does-not-exist-id/milestones/${milestoneId}`,
        )
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });

  describe("not found (404)", () => {
    it("returns 404 when the milestone id is unknown", async () => {
      const res = await request(app)
        .delete(
          `/api/projects/${projectId}/milestones/does-not-exist-id`,
        )
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });

    it("returns 404 when the milestone exists but belongs to a different project", async () => {
      const otherProjectId = await seedProjectWithMember(
        ownerUserId,
        "Other Delete Project",
      );
      const otherMilestone = await prisma.milestone.create({
        data: {
          projectId: otherProjectId,
          name: "Belongs elsewhere",
          status: "open",
        },
      });

      const res = await request(app)
        .delete(
          `/api/projects/${projectId}/milestones/${otherMilestone.id}`,
        )
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);

      // The other milestone must NOT be deleted.
      const stillThere = await prisma.milestone.findUnique({
        where: { id: otherMilestone.id },
      });
      expect(stillThere).not.toBeNull();
    });

    it("returns 404 for a second delete of the same milestone (idempotent edge)", async () => {
      await request(app)
        .delete(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies);

      const res = await request(app)
        .delete(`/api/projects/${projectId}/milestones/${milestoneId}`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });
});
