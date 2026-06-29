import type { PrismaClient } from "@prisma/client";
import type { BoardRepository } from "@boards/domain/repositories/board-repository.js";
import type { BoardResponseDto } from "@boards/application/dto/board-response-dto.js";

export class GetBoard {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(projectId: string): Promise<BoardResponseDto | null> {
    const board = await this.boardRepository.findByProjectId(projectId);
    if (!board) return null;

    // Fetch tasks per column using raw prisma since tasks module is not fully wired
    const columnsWithTasks = await Promise.all(
      board.columns.map(async (col) => {
        const tasks = await this.prisma.task.findMany({
          where: { columnId: col.id },
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            order: true,
            assigneeId: true,
            createdAt: true,
          },
        });

        return {
          id: col.id,
          title: col.title,
          order: col.order,
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            order: t.order,
            assigneeId: t.assigneeId,
            createdAt: t.createdAt.toISOString(),
          })),
        };
      }),
    );

    return {
      id: board.id,
      projectId: board.projectId,
      columns: columnsWithTasks,
    };
  }
}
