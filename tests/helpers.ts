import { prisma } from "@/prisma.js";

export async function clearDatabase(): Promise<void> {
  // PR A2: child-first ordering.
  //
  // The required order is:
  //   taskTag -> task -> column -> board -> sprint -> milestone ->
  //   projectMember -> project -> tag -> user
  //
  // Sprint is deleted BEFORE Project so that any Task.sprintId SetNull
  // semantics resolve cleanly and so that, when this test DB runs with
  // SQL foreign keys enabled (`PRAGMA foreign_keys = ON`), the
  // `Project -> Sprint (Cascade)` path does not race with the Task FK.
  // Milestone is deleted AFTER Sprint (its Sprint.milestoneId references
  // become null) and BEFORE Project (its Milestone.projectId cascades
  // would otherwise cascade-delete while Milestones are still referenced).
  //
  // The order of the existing chain (taskTag -> task -> column -> board ->
  // projectMember -> project -> tag -> user) is unchanged from the
  // pre-A2 helper. The two new lines are inserted between `board` and
  // `projectMember`.
  await prisma.taskTag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
}
