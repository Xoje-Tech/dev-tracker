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
 * End-to-end tests for GET /api/projects/:projectId/milestones.
 *
 * Ordering contract: targetDate ASC NULLS LAST, createdAt ASC.
 *
 * RED proof: this file is committed BEFORE the list use case +
 * controller wiring is in place. Every test fails with 404 (route not
 * registered) or 500 (no list handler) initially. The GREEN commit
 * adds ListMilestones + the controller.list method + the GET route.
 */
describe("GET /api/projects/:projectId/milestones (list)", () => {
  let app: Express;
  const OWNER = { email: "owner-milestones-list@test.com", name: "List Owner" };
  const OUTSIDER = {
    email: "outsider-milestones-list@test.com",
    name: "List Outsider",
  };
  let ownerUserId: string;
  let outsiderUserId: string;
  let ownerCookies: string;
  let outsiderCookies: string;
  let projectId: string;

  beforeAll(() => {
    app = buildMilestonesTestApp(
      defaultController(),
      "sessions-milestones-list.db",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerUserId = await seedUser(OWNER.email, OWNER.name);
    outsiderUserId = await seedUser(OUTSIDER.email, OUTSIDER.name);
    projectId = await seedProjectWithMember(ownerUserId, "List Project");
    ownerCookies = await primeSession(app, ownerUserId);
    outsiderCookies = await primeSession(app, outsiderUserId);
  });

  describe("empty case", () => {
    it("returns 200 with an empty array when the project has no milestones", async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("ordering", () => {
    it("orders by targetDate ASC NULLS LAST, then createdAt ASC", async () => {
      // Insert 4 milestones in mixed order so a naive implementation
      // would sort them by insertion order.
      const m1 = await prisma.milestone.create({
        data: {
          projectId,
          name: "No date, created first",
          // targetDate: null
          status: "open",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      });
      const m2 = await prisma.milestone.create({
        data: {
          projectId,
          name: "Far future date",
          targetDate: new Date("2027-06-01T00:00:00.000Z"),
          status: "open",
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
        },
      });
      const m3 = await prisma.milestone.create({
        data: {
          projectId,
          name: "Near future date",
          targetDate: new Date("2026-06-01T00:00:00.000Z"),
          status: "open",
          createdAt: new Date("2026-01-03T00:00:00.000Z"),
        },
      });
      const m4 = await prisma.milestone.create({
        data: {
          projectId,
          name: "No date, created second",
          // targetDate: null
          status: "open",
          createdAt: new Date("2026-01-04T00:00:00.000Z"),
        },
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(4);
      // First: m3 (targetDate 2026-06-01), then m2 (2027-06-01),
      // then null-date ones in createdAt order (m1 then m4).
      expect(res.body.map((m: { id: string }) => m.id)).toEqual([
        m3.id,
        m2.id,
        m1.id,
        m4.id,
      ]);
    });

    it("returns the full milestone shape for each entry", async () => {
      await prisma.milestone.create({
        data: {
          projectId,
          name: "Shape test",
          description: "shape",
          targetDate: new Date("2026-12-31T00:00:00.000Z"),
          status: "open",
        },
      });

      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        projectId,
        title: "Shape test",
        description: "shape",
        dueDate: "2026-12-31T00:00:00.000Z",
        status: "open",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe("authorization failures", () => {
    it("returns 403 when the actor is not a ProjectMember", async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones`)
        .set("Cookie", outsiderCookies);

      expect(res.status).toBe(403);
    });

    it("returns 401 when no session cookie is provided", async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones`);

      expect(res.status).toBe(401);
    });

    it("returns 404 when the project does not exist", async () => {
      const res = await request(app)
        .get(`/api/projects/does-not-exist-id/milestones`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });
});