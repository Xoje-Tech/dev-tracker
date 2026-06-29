import type { PrismaClient } from "@prisma/client";
import type { TaskRepository } from "@tasks/domain/repositories/task-repository.js";
import type { MoveTaskDto } from "@tasks/application/dto/move-task-dto.js";
import { AppError } from "@shared/infrastructure/http/error-handler.js";

export class MoveTask {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(id: string, dto: MoveTaskDto): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new AppError(404, "Task not found");
    }

    // Verify target column exists
    const targetColumn = await this.prisma.column.findUnique({
      where: { id: dto.targetColumnId },
    });
    if (!targetColumn) {
      throw new AppError(404, "Target column not found");
    }

    const sourceColumnId = task.columnId;
    const isSameColumn = sourceColumnId === dto.targetColumnId;

    // Get target column tasks to determine clamping
    const targetTasks = await this.taskRepository.findByColumn(dto.targetColumnId);

    let clampedIndex: number;
    if (isSameColumn) {
      // newIndex is in the array WITHOUT the moved task
      clampedIndex = Math.max(0, Math.min(dto.newIndex, targetTasks.length - 1));
    } else {
      clampedIndex = Math.max(0, Math.min(dto.newIndex, targetTasks.length));
    }

    await this.taskRepository.moveTask(id, dto.targetColumnId, clampedIndex);
  }
}
