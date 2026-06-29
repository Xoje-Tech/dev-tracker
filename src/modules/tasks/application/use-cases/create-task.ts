import type { TaskRepository } from "../../domain/repositories/task-repository.js";
import type { CreateTaskDto } from "../dto/create-task-dto.js";

export class CreateTask {
  constructor(_taskRepository: TaskRepository) {}

  async execute(_dto: CreateTaskDto, _creatorId: string): Promise<{ id: string }> {
    throw new Error("Not implemented");
  }
}
