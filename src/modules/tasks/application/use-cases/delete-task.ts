import type { TaskRepository } from "@tasks/domain/repositories/task-repository.js";

export class DeleteTask {
  constructor(_taskRepository: TaskRepository) {}

  async execute(_id: string): Promise<void> {
    throw new Error("Not implemented");
  }
}
