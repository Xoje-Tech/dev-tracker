import { prisma } from "@/prisma.js";

export async function clearDatabase(): Promise<void> {
  await prisma.taskTag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
}
