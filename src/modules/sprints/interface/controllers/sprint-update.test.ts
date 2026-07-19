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

describe("PATCH /api/projects/:projectId/sprints/:sprintId (update)", () => {
  let app: Express;
  const OWNER = { email: "owner-sprints-update@test.com", name: "Owner" };
  const OUTSIDER = {
    email: "outsider-sprints-update@test.com",
    name: "Outsider",
  };
  let ownerUserId: string;
  let outsiderUserId: string;
  let ownerCookies: string;
  let outsiderCookies: string;
  let projectId: string;
  let otherProjectId: string;
  let sprintId: string;

  beforeAll(() => {
    app = buildSprintsTestApp(
      defaultController(),
      "sessions-sprints-update.db",
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    ownerUserId = await seedUser(OWNER.email, OWNER.name);
    outsiderUserId = await seedUser(OUTSIDER.email, OUTSIDER.name);
    projectId = await seedProjectWithMember(ownerUserId, "Sprints Update Project");
    otherProjectId = await seedProjectWithMember(
      ownerUserId,
      "Other Sprints Update Project",
    );
    const sprint = await prisma.sprint.create({
      data: { projectId, name: "Original name" },
    });
    sprintId = sprint.id;
    ownerCookies = await primeSession(app, ownerUserId);
    outsiderCookies = await primeSession(app, outsiderUserId);
  });

  describe("happy path", () => {
    it("returns 200 with the updated sprint body on success", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", ownerCookies)
        .send({ name: "New name", description: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("New name");
      expect(res.body.description).toBe("Updated");
    });

    it("supports partial update (only name)", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", ownerCookies)
        .send({ name: "Just name" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Just name");
    });

    it("supports attaching a milestone", async () => {
      const milestone = await prisma.milestone.create({
        data: { projectId, name: "M1", status: "PLANNED" },
      });

      const res = await request(app)
        .patch(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", ownerCookies)
        .send({ milestoneId: milestone.id });

      expect(res.status).toBe(200);
      expect(res.body.milestoneId).toBe(milestone.id);
    });

    it("supports detaching a milestone (set to null)", async () => {
      const milestone = await prisma.milestone.create({
        data: { projectId, name: "M1", status: "PLANNED" },
      });
      await prisma.sprint.update({
        where: { id: sprintId },
        data: { milestoneId: milestone.id },
      });

      const res = await request(app)
        .patch(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", ownerCookies)
        .send({ milestoneId: null });

      expect(res.status).toBe(200);
      expect(res.body.milestoneId).toBeNull();
    });
  });

  describe("validation failures (400)", () => {
    it("rejects an empty name with 400", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", ownerCookies)
        .send({ name: "" });

      expect(res.status).toBe(400);
    });

    it("rejects a cross-project milestoneId with 400", async () => {
      const otherMilestone = await prisma.milestone.create({
        data: { projectId: otherProjectId, name: "Other M", status: "PLANNED" },
      });

      const res = await request(app)
        .patch(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", ownerCookies)
        .send({ milestoneId: otherMilestone.id });

      expect(res.status).toBe(400);
    });

    it("rejects a non-existent milestoneId with 400", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", ownerCookies)
        .send({ milestoneId: "ghost-milestone-id" });

      expect(res.status).toBe(400);
    });
  });

  describe("authorization failures", () => {
    it("returns 403 when the actor is not a ProjectMember", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/sprints/${sprintId}`)
        .set("Cookie", outsiderCookies)
        .send({ name: "Outsider update" });

      expect(res.status).toBe(403);
    });

    it("returns 404 when the sprint does not exist in the project", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/sprints/ghost-sprint-id`)
        .set("Cookie", ownerCookies)
        .send({ name: "Ghost update" });

      expect(res.status).toBe(404);
    });

    it("returns 404 when the sprint belongs to a different project", async () => {
      const otherSprint = await prisma.sprint.create({
        data: { projectId: otherProjectId, name: "Other sprint" },
      });

      const res = await request(app)
        .patch(`/api/projects/${projectId}/sprints/${otherSprint.id}`)
        .set("Cookie", ownerCookies)
        .send({ name: "Cross-project update" });

      expect(res.status).toBe(404);
    });
  });
});