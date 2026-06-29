import type { TaskRepository } from "@tasks/domain/repositories/task-repository.js";
import type { MoveTaskDto } from "@tasks/application/dto/move-task-dto.js";

export class MoveTask {
  constructor(_taskRepository: TaskRepository) {}

  async execute(_id: string, _dto: MoveTaskDto): Promise<void> {
    throw new Error("Not implemented");
  }
}
