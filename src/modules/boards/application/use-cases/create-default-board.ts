import type { BoardRepository } from "../../domain/repositories/board-repository.js";

export class CreateDefaultBoard {
  constructor(_boardRepository: BoardRepository) {}

  async execute(_projectId: string): Promise<unknown> {
    throw new Error("Not implemented");
  }
}
