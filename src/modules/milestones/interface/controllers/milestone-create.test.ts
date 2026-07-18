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
import { createApp } from "@/app.js";
import { prisma } from "@/prisma.js";
import { clearDatabase } from "../../../../../tests/helpers.js";

/**
 * End-to-end tests for POST /api/projects/:projectId/milestones.
 *
 * Uses the real createApp() composition root so the full middleware chain
 * (session cookie -> auth strategy -> membership guard -> controller) is
 * exercised. SQLite is real (no mocks for the DB). Auth identity is
 * established by registering a user via the API and reusing the session
 * cookie across requests, exactly mirroring session-cookie.test.ts and
 * auth-controller.test.ts.
 *
 * RED proof: this file is committed BEFORE the create-milestone use case
 * implementation. Every test below fails because the route does not yet
 * exist (404) or because the use case throws not-implemented. After the
 * GREEN implementation lands, every test passes.
 */
describe("POST /api/projects/:projectId/milestones (create)", () => {
  let app: Express;

  // Stable IDs for repeatable assertions.
  const OWNER = {
    email: "owner-milestones-create@test.com",
    name: "Milestones Create Owner",
    password: "password123",
  };
  const OUTSIDER = {
    email: "outsider-milestones-create@test.com",
    name: "Milestones Create Outsider",
    password: "password123",
  };

  let ownerCookies: string;
  let outsiderCookies: string;
  let projectId: string;

  async function registerAndLogin(
    credentials: { email: string; name: string; password: string },
  ): Promise<string> {
    const res = await request(app)
      .post("/api/auth/register")
      .send(credentials)
      .expect(201);
    const cookies = res.headers["set-cookie"];
    if (!cookies) {
      throw new Error("register did not return a session cookie");
    }
    return Array.isArray(cookies) ? cookies.join("; ") : cookies;
  }

  beforeAll(async () => {
    app = createApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerCookies = await registerAndLogin(OWNER);
    outsiderCookies = await registerAndLogin(OUTSIDER);

    // Create a project as the owner. The owner is auto-added as a
    // ProjectMember with role "owner" by CreateProject.execute().
    const projectRes = await request(app)
      .post("/api/projects")
      .set("Cookie", ownerCookies)
      .send({ name: "Milestones Create Project", description: "For tests" })
      .expect(201);
    projectId = projectRes.body.id;
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
      // Schema uses `targetDate`; the API contract exposes it as `dueDate`.
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