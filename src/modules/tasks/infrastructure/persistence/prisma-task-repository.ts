import type { TaskRepository } from "@tasks/domain/repositories/task-repository.js";
import type { Task } from "@tasks/domain/entities/task.js";
import type { PrismaClient } from "@prisma/client";

export class PrismaTaskRepository implements TaskRepository {
  constructor(_prisma: PrismaClient) {}

  async findById(_id: string): Promise<Task | null> {
    throw new Error("Not implemented");
  }

  async findByColumn(_columnId: string): Promise<Task[]> {
    throw new Error("Not implemented");
  }

  async create(): Promise<Task> {
    throw new Error("Not implemented");
  }

  async update(): Promise<Task> {
    throw new Error("Not implemented");
  }

  async delete(_id: string): Promise<void> {
    throw new Error("Not implemented");
  }
}
