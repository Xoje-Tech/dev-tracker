import type { TaskRepository } from "@tasks/domain/repositories/task-repository.js";
import type { UpdateTaskDto } from "@tasks/application/dto/update-task-dto.js";

export class UpdateTask {
  constructor(_taskRepository: TaskRepository) {}

  async execute(_id: string, _dto: UpdateTaskDto): Promise<unknown> {
    throw new Error("Not implemented");
  }
}
