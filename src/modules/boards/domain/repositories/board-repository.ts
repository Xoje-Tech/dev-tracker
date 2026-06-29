import type { Board } from "../entities/board.js";
import type { Column } from "../entities/column.js";

export interface BoardRepository {
  findByProjectId(projectId: string): Promise<(Board & { columns: Column[] }) | null>;
  createWithDefaultColumns(projectId: string): Promise<Board>;
}
