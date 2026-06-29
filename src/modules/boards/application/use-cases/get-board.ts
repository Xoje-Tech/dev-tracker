import type { BoardRepository } from "@boards/domain/repositories/board-repository.js";

export class GetBoard {
  constructor(_boardRepository: BoardRepository) {}

  async execute(_projectId: string): Promise<unknown | null> {
    throw new Error("Not implemented");
  }
}
