import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/prisma.js";
import { clearDatabase } from "../../helpers.js";

/**
 * FK cascade contract for Project -> Sprint (decision A from sdd-spec).
 *
 * The schema declares Sprint.projectId as ON DELETE CASCADE. This test
 * verifies that contract end-to-end by:
 *   1. Seeding a project with sprints.
 *   2. Calling prisma.project.delete() directly.
 *   3. Asserting all sprints of that project are gone.
 *
 * No project-delete API exists (out of scope per spec). The cascade
 * is exercised at the DB layer only, mirroring the milestones
 * cascade test in tests/integration/milestones/project-cascade.test.ts.
 */
describe("Project -> Sprint FK cascade", () => {
  beforeAll(async () => {});

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it("deletes all sprints of a project when the project is hard-deleted", async () => {
    const owner = await prisma.user.create({
      data: {
        email: "owner-cascade-sprints@test.com",
        name: "Sprint Cascade Owner",
        passwordHash: "test-hash",
      },
    });

    const project = await prisma.project.create({
      data: {
        name: "Sprint Cascade Test Project",
        description: "For sprint cascade verification",
        members: { create: { userId: owner.id, role: "owner" } },
      },
    });

    await prisma.sprint.createMany({
      data: [
        { projectId: project.id, name: "S1" },
        { projectId: project.id, name: "S2" },
        { projectId: project.id, name: "S3" },
      ],
    });

    const beforeCount = await prisma.sprint.count({
      where: { projectId: project.id },
    });
    expect(beforeCount).toBe(3);

    await prisma.project.delete({ where: { id: project.id } });

    const afterCount = await prisma.sprint.count({
      where: { projectId: project.id },
    });
    expect(afterCount).toBe(0);
  });
});