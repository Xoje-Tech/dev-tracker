import { describe, expect, it, beforeEach, vi } from "vitest";
import { prisma } from "@/prisma.js";
import { clearDatabase } from "../../helpers.js";

/**
 * PR A2 — child-first ordering for the new Milestone/Sprint FK chain.
 *
 * After A1 added the Milestone and Sprint models, `clearDatabase()` must wipe
 * them in the correct child-first order so every test starts from a clean
 * slate. The previous helper deleted `taskTag`/`task`/`column`/`board`/
 * `projectMember`/`project`/`tag`/`user` — it does NOT mention Sprint or
 * Milestone at all. Today those rows are only removed incidentally, via the
 * `Project → Sprint (Cascade) → Milestone` cascade chain. We want the helper
 * to delete Sprint and Milestone explicitly, BEFORE Project delete, so:
 *
 *   1. Cleanup is no longer dependent on the cascade firing in a particular
 *      order (defence in depth: some environments may run with foreign keys
 *      enabled at the connection level, e.g. `PRAGMA foreign_keys = ON`).
 *   2. The order is fixed: Sprint (clears Task.sprintId via SetNull) →
 *      Milestone (no longer referenced) → Project → ... existing chain.
 *   3. The helper's contract is self-documenting — anyone reading it sees
 *      every model it owns.
 *
 * Why we cannot rely on a foreign-key-violation RED: this project's test DB
 * is provisioned via `prisma db push` (see tests/global-setup.ts) without
 * enabling `PRAGMA foreign_keys = ON`, so SQLite does not enforce FKs at
 * runtime. The current helper therefore happens to leave zero Milestone/Sprint
 * rows because the Project cascade happens to clean them up. That is
 * incidental, not enforced. The tests below pin the contract via call-order
 * spies instead, which is the only deterministic proof available.
 *
 * FK chain reference (from prisma/schema.prisma):
 *   - Task.sprintId        -> Sprint.id        ON DELETE SET NULL
 *   - Sprint.milestoneId   -> Milestone.id     ON DELETE SET NULL
 *   - Sprint.projectId     -> Project.id       ON DELETE CASCADE
 *   - Milestone.projectId  -> Project.id       ON DELETE CASCADE
 */
describe("clearDatabase child-first ordering for Milestones and Sprints", () => {
  beforeEach(async () => {
    // Seed the FK chain we care about: Project -> Milestone -> Sprint -> Task.
    // Use a unique email per run so re-runs in the same DB don't trip the
    // User.email unique constraint.
    const unique = `alice-clear-db-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}@example.com`;

    const user = await prisma.user.create({
      data: {
        email: unique,
        name: "Alice Clear-DB",
        passwordHash: "hashed-not-real",
      },
    });

    const project = await prisma.project.create({
      data: {
        name: "Clear-DB Test Project",
        description: "Project exercising the Milestone/Sprint FK chain",
        members: {
          create: { userId: user.id, role: "owner" },
        },
      },
    });

    const milestone = await prisma.milestone.create({
      data: {
        projectId: project.id,
        name: "M1",
        description: "first milestone",
      },
    });

    const sprint = await prisma.sprint.create({
      data: {
        projectId: project.id,
        milestoneId: milestone.id,
        name: "S1",
      },
    });

    // Task also needs Column -> Board -> Project to satisfy the existing FK
    // chain. We attach it via Board.create so the helper's `column`/`board`
    // deletes still do real work.
    const board = await prisma.board.create({
      data: {
        projectId: project.id,
        columns: {
          create: [{ title: "Todo", order: 0 }],
        },
      },
      include: { columns: true },
    });
    const column = board.columns[0]!;

    await prisma.task.create({
      data: {
        columnId: column.id,
        creatorId: user.id,
        sprintId: sprint.id,
        title: "Task tied to sprint",
        order: 0,
      },
    });
  });

  it("calls prisma.sprint.deleteMany() during clearDatabase()", async () => {
    // RED proof of membership: today the helper does NOT call
    // prisma.sprint.deleteMany() at all, so the spy is never invoked and
    // this assertion fails. The fix (adding the call to tests/helpers.ts)
    // turns it GREEN.
    const sprintSpy = vi.spyOn(prisma.sprint, "deleteMany");
    try {
      await clearDatabase();
      expect(sprintSpy).toHaveBeenCalled();
    } finally {
      sprintSpy.mockRestore();
    }
  });

  it("calls prisma.milestone.deleteMany() during clearDatabase()", async () => {
    // Same RED proof of membership for Milestone.
    const milestoneSpy = vi.spyOn(prisma.milestone, "deleteMany");
    try {
      await clearDatabase();
      expect(milestoneSpy).toHaveBeenCalled();
    } finally {
      milestoneSpy.mockRestore();
    }
  });

  it("deletes Sprint before Project (child-first ordering)", async () => {
    // RED proof of ordering: the helper must invoke
    // `prisma.sprint.deleteMany()` strictly BEFORE
    // `prisma.project.deleteMany()`. Without that ordering, when SQL FKs are
    // enforced, deleting a Project first would try to cascade-delete Sprint
    // while Tasks still reference it — the contract requires explicit
    // child-first deletes.
    const order: string[] = [];
    const sprintSpy = vi
      .spyOn(prisma.sprint, "deleteMany")
      .mockImplementation(async () => {
        order.push("sprint");
        return { count: 0 };
      });
    const projectSpy = vi
      .spyOn(prisma.project, "deleteMany")
      .mockImplementation(async () => {
        order.push("project");
        return { count: 0 };
      });

    try {
      await clearDatabase();
      const sprintIndex = order.indexOf("sprint");
      const projectIndex = order.indexOf("project");
      expect(sprintIndex).toBeGreaterThanOrEqual(0);
      expect(projectIndex).toBeGreaterThanOrEqual(0);
      expect(sprintIndex).toBeLessThan(projectIndex);
    } finally {
      sprintSpy.mockRestore();
      projectSpy.mockRestore();
    }
  });

  it("deletes Milestone after Sprint and before Project (child-first ordering)", async () => {
    // RED proof of full ordering: Sprint, then Milestone, then Project.
    const order: string[] = [];
    const sprintSpy = vi
      .spyOn(prisma.sprint, "deleteMany")
      .mockImplementation(async () => {
        order.push("sprint");
        return { count: 0 };
      });
    const milestoneSpy = vi
      .spyOn(prisma.milestone, "deleteMany")
      .mockImplementation(async () => {
        order.push("milestone");
        return { count: 0 };
      });
    const projectSpy = vi
      .spyOn(prisma.project, "deleteMany")
      .mockImplementation(async () => {
        order.push("project");
        return { count: 0 };
      });

    try {
      await clearDatabase();
      const sprintIndex = order.indexOf("sprint");
      const milestoneIndex = order.indexOf("milestone");
      const projectIndex = order.indexOf("project");
      expect(sprintIndex).toBeGreaterThanOrEqual(0);
      expect(milestoneIndex).toBeGreaterThanOrEqual(0);
      expect(projectIndex).toBeGreaterThanOrEqual(0);
      expect(sprintIndex).toBeLessThan(milestoneIndex);
      expect(milestoneIndex).toBeLessThan(projectIndex);
    } finally {
      sprintSpy.mockRestore();
      milestoneSpy.mockRestore();
      projectSpy.mockRestore();
    }
  });
});
