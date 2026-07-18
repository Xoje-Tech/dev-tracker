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
 * End-to-end tests for POST /api/projects/:projectId/sprints.
 *
 * Mirrors the milestones create-cluster pattern. Uses the in-memory
 * sprints test app (see test-utils/test-app.ts) so the full middleware
 * chain (session -> auth -> validateBody -> controller -> use case ->
 * repo -> real SQLite) is exercised. Real SQLite, no DB mocks. Auth
 * identity is established by registering a user via Prisma and forging
 * a session via the test-only /api/test/prime-session route.
 *
 * RED proof (history): this file is committed BEFORE the create-sprint
 * implementation. Every test initially fails with 404 (route not
 * registered) or 500 (handler missing). The GREEN commit adds the
 * CreateSprint use case + SprintController.create + POST route.
 */
describe("POST /api/projects/:projectId/sprints (create)", () => {
  let app: Express;
  const OWNER = { email: "owner-sprints-create@test.com", name: "Owner" };
  const OUTSIDER = {
    email: "outsider-sprints-create@test.com",
    name: "Outsider",
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
      "sessions-sprints-create.db",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerUserId = await seedUser(OWNER.email, OWNER.name);
    outsiderUserId = await seedUser(OUTSIDER.email, OUTSIDER.name);
    projectId = await seedProjectWithMember(ownerUserId, "Sprints Create Project");
    otherProjectId = await seedProjectWithMember(
      ownerUserId,
      "Other Sprints Project",
    );
    ownerCookies = await primeSession(app, ownerUserId);
    outsiderCookies = await primeSession(app, outsiderUserId);
  });

  describe("happy path", () => {
    it("returns 201 with the created sprint body on success", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies)
        .send({ name: "Sprint 1", description: "First sprint" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        projectId,
        name: "Sprint 1",
        description: "First sprint",
        milestoneId: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("persists the sprint in the database with the expected fields", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies)
        .send({ name: "Persisted Sprint" });

      expect(res.status).toBe(201);
      const fromDb = await prisma.sprint.findUnique({
        where: { id: res.body.id },
      });
      expect(fromDb).not.toBeNull();
      expect(fromDb?.name).toBe("Persisted Sprint");
      expect(fromDb?.milestoneId).toBeNull();
      expect(fromDb?.projectId).toBe(projectId);
    });

    it("accepts a sprint attached to a milestone in the same project", async () => {
      const milestone = await prisma.milestone.create({
        data: { projectId, name: "M1", status: "PLANNED" },
      });

      const res = await request(app)
        .post(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies)
        .send({ name: "Sprint linked", milestoneId: milestone.id });

      expect(res.status).toBe(201);
      expect(res.body.milestoneId).toBe(milestone.id);
    });
  });

  describe("validation failures (400)", () => {
    it("rejects an empty name with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies)
        .send({ name: "" });

      expect(res.status).toBe(400);
    });

    it("rejects a whitespace-only name with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies)
        .send({ name: "   " });

      expect(res.status).toBe(400);
    });

    it("rejects a missing name with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies)
        .send({});

      expect(res.status).toBe(400);
    });

    it("rejects a name exceeding 120 chars with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies)
        .send({ name: "x".repeat(121) });

      expect(res.status).toBe(400);
    });

    it("rejects a milestoneId that belongs to a different project with 400", async () => {
      const otherMilestone = await prisma.milestone.create({
        data: { projectId: otherProjectId, name: "Other M", status: "PLANNED" },
      });

      const res = await request(app)
        .post(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies)
        .send({ name: "Cross-project sprint", milestoneId: otherMilestone.id });

      expect(res.status).toBe(400);
    });

    it("rejects a milestoneId that does not exist with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies)
        .send({
          name: "Sprint with ghost milestone",
          milestoneId: "milestone-that-does-not-exist",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("authorization failures", () => {
    it("returns 403 when the actor is not a ProjectMember", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/sprints`)
        .set("Cookie", outsiderCookies)
        .send({ name: "Outsider sprint" });

      expect(res.status).toBe(403);
    });

    it("returns 401 when no session cookie is provided", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/sprints`)
        .send({ name: "No auth sprint" });

      expect(res.status).toBe(401);
    });

    it("returns 404 when the project does not exist", async () => {
      const res = await request(app)
        .post(`/api/projects/non-existent-project-id/sprints`)
        .set("Cookie", ownerCookies)
        .send({ name: "Ghost project sprint" });

      expect(res.status).toBe(404);
    });
  });
});