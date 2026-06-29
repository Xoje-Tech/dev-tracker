import type { PrismaClient } from "@prisma/client";
import { Board as PrismaBoard, Column as PrismaColumn } from "@prisma/client";
import type { BoardRepository } from "@boards/domain/repositories/board-repository.js";
import { Board } from "@boards/domain/entities/board.js";
import { Column } from "@boards/domain/entities/column.js";

const DEFAULT_COLUMNS = [
  { title: "Backlog", order: 0 },
  { title: "In Progress", order: 1 },
  { title: "Review", order: 2 },
  { title: "Done", order: 3 },
];

function toDomainBoard(b: PrismaBoard): Board {
  return new Board({
    id: b.id,
    projectId: b.projectId,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  });
}

function toDomainColumn(c: PrismaColumn): Column {
  return new Column({
    id: c.id,
    boardId: c.boardId,
    title: c.title,
    order: c.order,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  });
}

export class PrismaBoardRepository implements BoardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByProjectId(projectId: string): Promise<(Board & { columns: Column[] }) | null> {
    const found = await this.prisma.board.findUnique({
      where: { projectId },
      include: {
        columns: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
    if (!found) return null;
    return {
      ...toDomainBoard(found),
      columns: found.columns.map(toDomainColumn),
    };
  }

  async findById(id: string): Promise<(Board & { columns: Column[] }) | null> {
    const found = await this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { order: "asc" },
        },
      },
    });
    if (!found) return null;
    return {
      ...toDomainBoard(found),
      columns: found.columns.map(toDomainColumn),
    };
  }

  async createWithDefaultColumns(projectId: string): Promise<Board> {
    const created = await this.prisma.board.create({
      data: {
        projectId,
        columns: {
          create: DEFAULT_COLUMNS,
        },
      },
    });
    return toDomainBoard(created);
  }
}
