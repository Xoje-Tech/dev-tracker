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
  buildSprintsTestApp,
  defaultController,
  primeSession,
  seedProjectWithMember,
  seedUser,
} from "@sprints/test-utils/test-app.js";

/**
 * End-to-end tests for GET /api/projects/:projectId/sprints/:sprintId.
 *
 * RED proof: this file is committed BEFORE the GetSprint use case +
 * controller.get method + route are in place. Every test fails with
 * 404 (route not registered) initially. The GREEN commit wires the
 * use case + controller.
 *
 * Scenarios (from the spec):
 *   - member-fetch-200
 *   - unknown-id-404
 *   - non-member-403-no-lookup
 *   - cross-project-404
 */
describe("GET /api/projects/:projectId/sprints/:sprintId (get-by-id)", () => {
  let app: Express;
  const OWNER = { email: "owner-sprints-get@test.com", name: "Get Owner" };
  const OUTSIDER = {
    email: "outsider-sprints-get@test.com",
    name: "Get Outsider",
  };
  let ownerUserId: string;
  let outsiderUserId: string;
  let ownerCookies: string;
  let outsiderCookies: string;
  let projectId: string;
  let otherProjectId: string;

  beforeAll(() => {
    app = buildSprintsTestApp(
      defaultController(),
      "sessions-sprints-get.db",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerUserId = await seedUser(OWNER.email, OWNER.name);
    outsiderUserId = await seedUser(OUTSIDER.email, OUTSIDER.name);
    projectId = await seedProjectWithMember(ownerUserId, "Get Sprint Project");
    otherProjectId = await seedProjectWithMember(
      ownerUserId,
      "Other Get Sprint Project",
    );
    ownerCookies = await primeSession(app, ownerUserId);
    outsiderCookies = await primeSession(app, outsiderUserId);
  });

  describe("happy path (member-fetch-200)", () => {
    it("returns 200 with the sprint DTO when a member fetches an existing sprint", async () => {
      const created = await prisma.sprint.create({
        data: {
          projectId,
          name: "Sprint Alpha",
          description: "First sprint",
        },
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}/sprints/${created.id}`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: created.id,
        projectId,
        name: "Sprint Alpha",
        description: "First sprint",
        milestoneId: null,
      });
      expect(typeof res.body.createdAt).toBe("string");
      expect(typeof res.body.updatedAt).toBe("string");
    });
  });

  describe("not found (unknown-id-404)", () => {
    it("returns 404 when the sprint id does not exist", async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/sprints/does-not-exist`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });

  describe("authorization (non-member-403-no-lookup)", () => {
    it("returns 403 when the actor is not a ProjectMember", async () => {
      const created = await prisma.sprint.create({
        data: { projectId, name: "Private sprint" },
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}/sprints/${created.id}`)
        .set("Cookie", outsiderCookies);

      expect(res.status).toBe(403);
    });

    it("returns 404 (not 403) when the project itself does not exist", async () => {
      const res = await request(app)
        .get(`/api/projects/non-existent-project/sprints/whatever`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });

  describe("cross-project isolation (cross-project-404)", () => {
    it("returns 404 when the sprint belongs to a different project", async () => {
      const inOtherProject = await prisma.sprint.create({
        data: { projectId: otherProjectId, name: "Other project sprint" },
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}/sprints/${inOtherProject.id}`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });
});