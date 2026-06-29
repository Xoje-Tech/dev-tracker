/**
 * Board module — domain types.
 * Mirrors backend src/modules/boards/application/dto/board-response-dto.ts
 * and src/modules/tasks/application/dto/*.
 */

export type Priority = "low" | "medium" | "high";

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  order: number;
  assigneeId: string | null;
  createdAt: string;
}

export interface BoardColumn {
  id: string;
  title: string;
  order: number;
  tasks: BoardTask[];
}

export interface Board {
  id: string;
  projectId: string;
  columns: BoardColumn[];
}

export interface CreateTaskInput {
  columnId: string;
  title: string;
  description?: string;
  priority?: Priority;
  assigneeId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: Priority;
  assigneeId?: string | null;
}

export interface MoveTaskInput {
  targetColumnId: string;
  newIndex: number;
}
