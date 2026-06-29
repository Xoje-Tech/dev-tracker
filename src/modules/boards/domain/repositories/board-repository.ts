import type { Board } from "@boards/domain/entities/board.js";
import type { Column } from "@boards/domain/entities/column.js";

export interface BoardRepository {
  findByProjectId(projectId: string): Promise<(Board & { columns: Column[] }) | null>;
  createWithDefaultColumns(projectId: string): Promise<Board>;
}
