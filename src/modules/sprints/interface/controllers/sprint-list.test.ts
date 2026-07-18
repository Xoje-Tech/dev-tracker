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
 * End-to-end tests for GET /api/projects/:projectId/sprints.
 *
 * Mirrors the milestones list-cluster pattern.
 *
 * RED proof (history): this file is committed BEFORE the list impl.
 * Every test initially fails with 404 (route registered but no list
 * handler) — but in practice with fileParallelism: false and the
 * controller.list method already wired (via create-sprint commit), the
 * tests would fail with 500 because list-milestones isn't implemented
 * yet at the use case level... wait, it IS. So this RED is observable
 * via a different code path. See the GREEN commit.
 */
describe("GET /api/projects/:projectId/sprints (list)", () => {
  let app: Express;
  const OWNER = { email: "owner-sprints-list@test.com", name: "List Owner" };
  const OUTSIDER = {
    email: "outsider-sprints-list@test.com",
    name: "List Outsider",
  };
  let ownerUserId: string;
  let outsiderUserId: string;
  let ownerCookies: string;
  let outsiderCookies: string;
  let projectId: string;

  beforeAll(() => {
    app = buildSprintsTestApp(
      defaultController(),
      "sessions-sprints-list.db",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerUserId = await seedUser(OWNER.email, OWNER.name);
    outsiderUserId = await seedUser(OUTSIDER.email, OUTSIDER.name);
    projectId = await seedProjectWithMember(ownerUserId, "Sprints List Project");
    ownerCookies = await primeSession(app, ownerUserId);
    outsiderCookies = await primeSession(app, outsiderUserId);
  });

  describe("empty case", () => {
    it("returns 200 with an empty array when the project has no sprints", async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("ordering", () => {
    it("orders sprints by createdAt ASC", async () => {
      const s1 = await prisma.sprint.create({
        data: {
          projectId,
          name: "First sprint",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      });
      const s2 = await prisma.sprint.create({
        data: {
          projectId,
          name: "Second sprint",
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
        },
      });
      const s3 = await prisma.sprint.create({
        data: {
          projectId,
          name: "Third sprint",
          createdAt: new Date("2026-01-03T00:00:00.000Z"),
        },
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body.map((s: { id: string }) => s.id)).toEqual([
        s1.id,
        s2.id,
        s3.id,
      ]);
    });
  });

  describe("response shape", () => {
    it("returns the full sprint shape for each entry", async () => {
      const s = await prisma.sprint.create({
        data: { projectId, name: "Shape check", description: "Has desc" },
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id: s.id,
        projectId,
        name: "Shape check",
        description: "Has desc",
        milestoneId: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe("authorization failures", () => {
    it("returns 403 when the actor is not a ProjectMember", async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/sprints`)
        .set("Cookie", outsiderCookies);

      expect(res.status).toBe(403);
    });

    it("returns 401 when no session cookie is provided", async () => {
      const res = await request(app).get(`/api/projects/${projectId}/sprints`);

      expect(res.status).toBe(401);
    });

    it("returns 404 when the project does not exist", async () => {
      const res = await request(app)
        .get(`/api/projects/non-existent-project-id/sprints`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });

  describe("isolation", () => {
    it("does not include sprints from other projects", async () => {
      const otherProjectId = await seedProjectWithMember(
        ownerUserId,
        "Other List Project",
      );
      await prisma.sprint.create({
        data: { projectId: otherProjectId, name: "Other sprint" },
      });
      await prisma.sprint.create({
        data: { projectId, name: "My sprint" },
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}/sprints`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("My sprint");
    });
  });
});