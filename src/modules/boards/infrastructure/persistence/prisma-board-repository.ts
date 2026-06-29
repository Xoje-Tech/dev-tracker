import type { BoardRepository } from "../../domain/repositories/board-repository.js";
import type { Board } from "../../domain/entities/board.js";
import type { Column } from "../../domain/entities/column.js";
import type { PrismaClient } from "@prisma/client";

export class PrismaBoardRepository implements BoardRepository {
  constructor(_prisma: PrismaClient) {}

  async findByProjectId(_projectId: string): Promise<(Board & { columns: Column[] }) | null> {
    throw new Error("Not implemented");
  }

  async createWithDefaultColumns(): Promise<Board> {
    throw new Error("Not implemented");
  }
}
