import type { PrismaClient } from "@prisma/client";
import type { TaskRepository } from "@tasks/domain/repositories/task-repository.js";
import type { CreateTaskDto } from "@tasks/application/dto/create-task-dto.js";
import type { TaskResponseDto } from "@tasks/application/dto/task-response-dto.js";
import { Task } from "@tasks/domain/entities/task.js";
import { TaskTitle } from "@tasks/domain/value-objects/task-title.js";
import { TaskPriority } from "@tasks/domain/value-objects/task-priority.js";
import { AppError } from "@shared/infrastructure/http/error-handler.js";

export class CreateTask {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(dto: CreateTaskDto, creatorId: string): Promise<TaskResponseDto> {
    // Validate column exists
    const column = await this.prisma.column.findUnique({
      where: { id: dto.columnId },
    });
    if (!column) {
      throw new AppError(404, "Column not found");
    }

    const title = new TaskTitle(dto.title);
    const priority = new TaskPriority(dto.priority);

    // Get max order in column
    const existingTasks = await this.taskRepository.findByColumn(dto.columnId);
    const maxOrder =
      existingTasks.length > 0
        ? Math.max(...existingTasks.map((t) => t.order)) + 1
        : 0;

    const now = new Date();
    const id = crypto.randomUUID();

    const task = new Task({
      id,
      columnId: dto.columnId,
      title: title.value,
      description: dto.description ?? null,
      priority: priority.value,
      order: maxOrder,
      assigneeId: dto.assigneeId ?? null,
      creatorId,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.taskRepository.create(task);

    return {
      id: saved.id,
      columnId: saved.columnId,
      title: saved.title,
      description: saved.description,
      priority: saved.priority,
      order: saved.order,
      assigneeId: saved.assigneeId,
      creatorId: saved.creatorId,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }
}
