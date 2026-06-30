import type { BoardRepository } from "@boards/domain/repositories/board-repository.js";
import type { BoardResponseDto } from "@boards/application/dto/board-response-dto.js";

export class CreateDefaultBoard {
  constructor(private readonly boardRepository: BoardRepository) {}

  async execute(projectId: string): Promise<BoardResponseDto> {
    const board = await this.boardRepository.createWithDefaultColumns(projectId);
    return {
      id: board.id,
      projectId: board.projectId,
      columns: [],
    };
  }
}
