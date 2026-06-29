import type { Task } from "@tasks/domain/entities/task.js";

export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  findByColumn(columnId: string): Promise<Task[]>;
  create(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
  moveTask(taskId: string, targetColumnId: string, newIndex: number): Promise<void>;
  getColumnsForReorder(taskId: string, targetColumnId: string): Promise<{
    sourceColumnId: string;
    sourceTasks: Task[];
    targetTasks: Task[];
  }>;
}
