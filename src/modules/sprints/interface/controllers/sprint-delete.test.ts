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

describe("DELETE /api/projects/:projectId/sprints/:sprintId (delete)", () => {
  let app: Express;
  const OWNER = { email: "owner-sprints-delete@test.com", name: "Owner" };
  const OUTSIDER = {
    email: "outsider-sprints-delete@test.com",
    name: "Outsider",
  };
  let ownerUserId: string;
  let outsiderUserId: string;
  let ownerCookies: string;
  let outsiderCookies: string;
  let projectId: string;
  let sprintId: string;

  beforeAll(() => {
    app = buildSprintsTestApp(
      defaultController(),
      "sessions-sprints-delete.db",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerUserId = await seedUser(OWNER.email, OWNER.name);
    outsiderUserId = await seedUser(OUTSIDER.email, OUTSIDER.name);
    projectId = await seedProjectWithMember(ownerUserId, "Sprints Delete Project");
    const sprint = await prisma.sprint.create({
      data: { projectId, name: "To be deleted" },
    });
    sprintId = sprint.id;
    ownerCookies = await primeSession(app, ownerUserId);
    outsiderCookies = await primeSession(app, outsiderUserId);
  });

  describe("happy path", () => {
    it("returns 204 on success", async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(204);
    });

    it("removes the sprint from the database", async () => {
      await request(app)
        .delete(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", ownerCookies);

      const fromDb = await prisma.sprint.findUnique({ where: { id: sprintId } });
      expect(fromDb).toBeNull();
    });

    it("preserves Tasks with sprintId=null (FK SetNull, decision A)", async () => {
      // Create a board + column + task linked to this sprint.
      // Column schema: title (not name), order (not index).
      // Task schema: order is required, assigneeId optional.
      const board = await prisma.board.create({
        data: {
          projectId,
          columns: { create: { title: "C", order: 0 } },
        },
      });
      const column = await prisma.column.findFirst({
        where: { boardId: board.id },
      });
      const task = await prisma.task.create({
        data: {
          title: "Linked task",
          columnId: column!.id,
          sprintId,
          creatorId: ownerUserId,
          order: 0,
        },
      });

      const res = await request(app)
        .delete(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(204);
      const taskAfter = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(taskAfter).not.toBeNull();
      expect(taskAfter?.sprintId).toBeNull();
    });
  });

  describe("authorization failures", () => {
    it("returns 403 when the actor is not a ProjectMember", async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", outsiderCookies);

      expect(res.status).toBe(403);
    });

    it("returns 404 when the sprint does not exist", async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}/sprints/ghost-sprint-id`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });
  });
});