import type { PrismaClient } from "@prisma/client";
import type { TaskRepository } from "@tasks/domain/repositories/task-repository.js";
import type { UpdateTaskDto } from "@tasks/application/dto/update-task-dto.js";
import type { TaskResponseDto } from "@tasks/application/dto/task-response-dto.js";
import { Task } from "@tasks/domain/entities/task.js";
import { TaskTitle } from "@tasks/domain/value-objects/task-title.js";
import { TaskPriority } from "@tasks/domain/value-objects/task-priority.js";
import { AppError } from "@shared/infrastructure/http/error-handler.js";

export class UpdateTask {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(id: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    const existing = await this.taskRepository.findById(id);
    if (!existing) {
      throw new AppError(404, "Task not found");
    }

    const title = dto.title !== undefined ? new TaskTitle(dto.title) : null;
    const priority =
      dto.priority !== undefined ? new TaskPriority(dto.priority) : null;

    const updated = new Task({
      id: existing.id,
      columnId: existing.columnId,
      title: title ? title.value : existing.title,
      description: dto.description !== undefined ? dto.description : existing.description,
      priority: priority ? priority.value : existing.priority,
      order: existing.order,
      assigneeId: dto.assigneeId !== undefined ? dto.assigneeId : existing.assigneeId,
      creatorId: existing.creatorId,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.taskRepository.update(updated);
    const tags = await this.prisma.taskTag.findMany({
      where: { taskId: saved.id },
      select: { tagId: true },
    });

    return {
      id: saved.id,
      columnId: saved.columnId,
      title: saved.title,
      description: saved.description,
      priority: saved.priority,
      order: saved.order,
      assigneeId: saved.assigneeId,
      creatorId: saved.creatorId,
      tagIds: tags.map((t) => t.tagId),
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }
}
