import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/prisma.js";
import { clearDatabase } from "../../helpers.js";

/**
 * FK cascade contract for Project -> Milestone.
 *
 * The schema declares Milestone.projectId as ON DELETE CASCADE. This
 * test verifies that contract end-to-end by:
 *   1. Seeding a project with several milestones (and a member, so the
 *      row is otherwise valid).
 *   2. Calling prisma.project.delete() directly.
 *   3. Asserting all milestones of that project are gone.
 *
 * There is no project-delete API (out of scope per spec). The cascade
 * is exercised at the DB layer only, which is the layer where it
 * actually matters for data integrity.
 *
 * This complements the SQL-literal regex assertion in
 * tests/integration/migrations/roadmap-and-sprints-fk-cascade.test.ts.
 * That test pins the migration text; this one pins the runtime
 * behaviour.
 */
describe("Project -> Milestone FK cascade", () => {
  beforeAll(async () => {
    // No app needed — this test exercises the Prisma client directly.
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it("deletes all milestones of a project when the project is hard-deleted", async () => {
    const owner = await prisma.user.create({
      data: {
        email: "owner-cascade@test.com",
        name: "Cascade Owner",
        passwordHash: "test-hash",
      },
    });

    const project = await prisma.project.create({
      data: {
        name: "Cascade Test Project",
        description: "For cascade verification",
        members: { create: { userId: owner.id, role: "owner" } },
      },
    });

    await prisma.milestone.createMany({
      data: [
        { projectId: project.id, name: "M1", status: "PLANNED" },
        { projectId: project.id, name: "M2", status: "PLANNED" },
        { projectId: project.id, name: "M3", status: "PLANNED" },
      ],
    });

    const beforeCount = await prisma.milestone.count({
      where: { projectId: project.id },
    });
    expect(beforeCount).toBe(3);

    await prisma.project.delete({ where: { id: project.id } });

    const afterCount = await prisma.milestone.count({
      where: { projectId: project.id },
    });
    expect(afterCount).toBe(0);
  });

  it("does not affect milestones of OTHER projects on hard-delete", async () => {
    const owner = await prisma.user.create({
      data: {
        email: "owner-isolation@test.com",
        name: "Isolation Owner",
        passwordHash: "test-hash",
      },
    });

    const projectA = await prisma.project.create({
      data: {
        name: "Project A",
        description: "Will be deleted",
        members: { create: { userId: owner.id, role: "owner" } },
      },
    });
    const projectB = await prisma.project.create({
      data: {
        name: "Project B",
        description: "Survives",
        members: { create: { userId: owner.id, role: "owner" } },
      },
    });

    await prisma.milestone.create({
      data: { projectId: projectA.id, name: "A1", status: "PLANNED" },
    });
    await prisma.milestone.create({
      data: { projectId: projectB.id, name: "B1", status: "PLANNED" },
    });
    await prisma.milestone.create({
      data: { projectId: projectB.id, name: "B2", status: "PLANNED" },
    });

    await prisma.project.delete({ where: { id: projectA.id } });

    const remaining = await prisma.milestone.findMany({
      select: { name: true, projectId: true },
    });
    expect(remaining).toHaveLength(2);
    expect(remaining.map((m: { name: string }) => m.name).sort()).toEqual(["B1", "B2"]);
    expect(remaining.every((m: { projectId: string }) => m.projectId === projectB.id)).toBe(true);
  });
});
