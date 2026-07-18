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
 * End-to-end tests for GET /api/projects/:projectId/milestones/:milestoneId.
 *
 * RED proof: this file is committed BEFORE the GetMilestone use case +
 * controller.get method + route are in place. Every test fails with
 * 404 (route not registered) or 500 (no handler) initially. The GREEN
 * commit adds the use case + controller wiring.
 *
 * Scenarios (from the spec):
 *   - member-fetch-200
 *   - unknown-id-404
 *   - non-member-403-no-lookup
 *   - cross-project-404
 */
describe("GET /api/projects/:projectId/milestones/:milestoneId (get-by-id)", () => {
  let app: Express;
  const OWNER = { email: "owner-milestones-get@test.com", name: "Get Owner" };
  const OUTSIDER = {
    email: "outsider-milestones-get@test.com",
    name: "Get Outsider",
  };
  let ownerUserId: string;
  let outsiderUserId: string;
  let ownerCookies: string;
  let outsiderCookies: string;
  let projectId: string;
  let otherProjectId: string;

  beforeAll(() => {
    app = buildMilestonesTestApp(
      defaultController(),
      "sessions-milestones-get.db",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerUserId = await seedUser(OWNER.email, OWNER.name);
    outsiderUserId = await seedUser(OUTSIDER.email, OUTSIDER.name);
    projectId = await seedProjectWithMember(ownerUserId, "Get Project");
    otherProjectId = await seedProjectWithMember(
      ownerUserId,
      "Other Get Project",
    );
    ownerCookies = await primeSession(app, ownerUserId);
    outsiderCookies = await primeSession(app, outsiderUserId);
  });

  describe("happy path (member-fetch-200)", () => {
    it("returns 200 with the milestone DTO when a member fetches an existing milestone", async () => {
      const created = await prisma.milestone.create({
        data: {
          projectId,
          name: "Alpha launch",
          description: "First release",
          status: "OPEN",
        },
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones/${created.id}`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: created.id,
        projectId,
        title: "Alpha launch",
        description: "First release",
        status: "open",
      });
      expect(typeof res.body.createdAt).toBe("string");
      expect(typeof res.body.updatedAt).toBe("string");
    });
  });

  describe("not found (unknown-id-404)", () => {
    it("returns 404 when the milestone id does not exist", async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones/does-not-exist`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });

  describe("authorization (non-member-403-no-lookup)", () => {
    it("returns 403 when the actor is not a ProjectMember and never looks up the milestone", async () => {
      const created = await prisma.milestone.create({
        data: { projectId, name: "Private", status: "OPEN" },
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones/${created.id}`)
        .set("Cookie", outsiderCookies);

      expect(res.status).toBe(403);
    });

    it("returns 404 (not 403) when the project itself does not exist", async () => {
      const res = await request(app)
        .get(`/api/projects/non-existent-project/milestones/whatever`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });

  describe("cross-project isolation (cross-project-404)", () => {
    it("returns 404 when the milestone belongs to a different project", async () => {
      const inOtherProject = await prisma.milestone.create({
        data: {
          projectId: otherProjectId,
          name: "Other project milestone",
          status: "OPEN",
        },
      });

      // Owner is a member of BOTH projects, so membership check passes
      // for projectId. The milestone lookup scoped to projectId must
      // surface as 404 — the milestone exists but not within this project.
      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones/${inOtherProject.id}`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });
});