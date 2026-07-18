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
 * End-to-end tests for POST /api/projects/:projectId/milestones.
 *
 * Uses the in-memory milestones test app (see test-utils/test-app.ts) so
 * the full middleware chain (session -> auth -> validateBody -> controller
 * -> use case -> repo -> real SQLite) is exercised. Real SQLite, no DB
 * mocks. Auth identity is established by registering a user via Prisma
 * and forging a session via the test-only /api/test/prime-session route.
 *
 * RED proof (history): the file was committed BEFORE the create-milestone
 * implementation, so every test initially failed with 404. After the
 * GREEN commit landed, the cluster passes 10/10.
 */
describe("POST /api/projects/:projectId/milestones (create)", () => {
  let app: Express;
  const OWNER = { email: "owner-milestones-create@test.com", name: "Owner" };
  const OUTSIDER = {
    email: "outsider-milestones-create@test.com",
    name: "Outsider",
  };
  let ownerUserId: string;
  let outsiderUserId: string;
  let ownerCookies: string;
  let outsiderCookies: string;
  let projectId: string;

  beforeAll(() => {
    app = buildMilestonesTestApp(
      defaultController(),
      "sessions-milestones-create.db",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerUserId = await seedUser(OWNER.email, OWNER.name);
    outsiderUserId = await seedUser(OUTSIDER.email, OUTSIDER.name);
    projectId = await seedProjectWithMember(ownerUserId, "Create Project");
    ownerCookies = await primeSession(app, ownerUserId);
    outsiderCookies = await primeSession(app, outsiderUserId);
  });

  describe("happy path", () => {
    it("returns 201 with the created milestone body on success", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({
          title: "v1.0 GA",
          description: "First public release",
          dueDate: "2026-12-31T00:00:00.000Z",
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        projectId,
        title: "v1.0 GA",
        description: "First public release",
        status: "open",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(typeof res.body.dueDate).toBe("string");
      expect(new Date(res.body.dueDate).toISOString()).toBe(
        "2026-12-31T00:00:00.000Z",
      );
    });

    it("persists the milestone in the database with the expected fields", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "Persisted M", description: null });

      expect(res.status).toBe(201);
      const fromDb = await prisma.milestone.findUnique({
        where: { id: res.body.id },
      });
      expect(fromDb).not.toBeNull();
      expect(fromDb).toMatchObject({
        id: res.body.id,
        projectId,
        name: "Persisted M",
        description: null,
        status: "open",
      });
    });

    it("accepts a milestone with only the required title field", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "Minimal" });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Minimal");
      expect(res.body.description).toBeNull();
      expect(res.body.dueDate).toBeNull();
    });
  });

  describe("validation failures (400)", () => {
    it("rejects an empty title with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "" });

      expect(res.status).toBe(400);
    });

    it("rejects a whitespace-only title with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "   " });

      expect(res.status).toBe(400);
    });

    it("rejects a missing title with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ description: "no title" });

      expect(res.status).toBe(400);
    });

    it("rejects a malformed dueDate with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "Bad date", dueDate: "not-a-date" });

      expect(res.status).toBe(400);
    });
  });

  describe("authorization failures", () => {
    it("returns 403 when the actor is not a ProjectMember", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", outsiderCookies)
        .send({ title: "Sneaky" });

      expect(res.status).toBe(403);
    });

    it("returns 401 when no session cookie is provided", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .send({ title: "Anonymous" });

      expect(res.status).toBe(401);
    });

    it("returns 404 when the project does not exist", async () => {
      const res = await request(app)
        .post(`/api/projects/does-not-exist-id/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "Ghost project" });

      expect(res.status).toBe(404);
    });
  });
});