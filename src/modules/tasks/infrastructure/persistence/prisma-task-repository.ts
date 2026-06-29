import type { PrismaClient, Task as PrismaTask } from "@prisma/client";
import type { TaskRepository } from "@tasks/domain/repositories/task-repository.js";
import { Task } from "@tasks/domain/entities/task.js";

function toDomain(t: PrismaTask): Task {
  return new Task({
    id: t.id,
    columnId: t.columnId,
    title: t.title,
    description: t.description,
    priority: t.priority,
    order: t.order,
    assigneeId: t.assigneeId,
    creatorId: t.creatorId,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  });
}

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Task | null> {
    const found = await this.prisma.task.findUnique({ where: { id } });
    return found ? toDomain(found) : null;
  }

  async findByColumn(columnId: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { columnId },
      orderBy: { order: "asc" },
    });
    return tasks.map(toDomain);
  }

  async create(task: Task): Promise<Task> {
    const created = await this.prisma.task.create({
      data: {
        id: task.id,
        columnId: task.columnId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        order: task.order,
        assigneeId: task.assigneeId,
        creatorId: task.creatorId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
    });
    return toDomain(created);
  }

  async update(task: Task): Promise<Task> {
    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        order: task.order,
        assigneeId: task.assigneeId,
        columnId: task.columnId,
      },
    });
    return toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  async getColumnsForReorder(taskId: string, targetColumnId: string): Promise<{
    sourceColumnId: string;
    sourceTasks: Task[];
    targetTasks: Task[];
  }> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const sourceColumnId = task.columnId;
    const [sourceTasks, targetTasks] = await Promise.all([
      this.prisma.task.findMany({
        where: { columnId: sourceColumnId },
        orderBy: { order: "asc" },
      }),
      sourceColumnId === targetColumnId
        ? []
        : this.prisma.task.findMany({
            where: { columnId: targetColumnId },
            orderBy: { order: "asc" },
          }),
    ]);

    return {
      sourceColumnId,
      sourceTasks: sourceTasks.map(toDomain),
      targetTasks: targetTasks.map(toDomain),
    };
  }

  async moveTask(taskId: string, targetColumnId: string, newIndex: number): Promise<void> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const sourceColumnId = task.columnId;
    const isSameColumn = sourceColumnId === targetColumnId;

    await this.prisma.$transaction(async (tx) => {
      // Get source column tasks (excluding the moved task)
      const sourceTasks = await tx.task.findMany({
        where: { columnId: sourceColumnId },
        orderBy: { order: "asc" },
      });

      // Remove task from source and reindex
      const sourceWithoutMoved = sourceTasks.filter((t) => t.id !== taskId);
      for (let i = 0; i < sourceWithoutMoved.length; i++) {
        if (sourceWithoutMoved[i]!.order !== i) {
          await tx.task.update({
            where: { id: sourceWithoutMoved[i]!.id },
            data: { order: i },
          });
        }
      }

      if (isSameColumn) {
        // Insert at newIndex in the same column (array without the moved task)
        const clampedIndex = Math.max(0, Math.min(newIndex, sourceWithoutMoved.length));
        const targetOrder = clampedIndex >= sourceWithoutMoved.length
          ? sourceWithoutMoved.length
          : clampedIndex;

        // Shift tasks at and after target position
        for (let i = sourceWithoutMoved.length - 1; i >= clampedIndex; i--) {
          await tx.task.update({
            where: { id: sourceWithoutMoved[i]!.id },
            data: { order: i + 1 },
          });
        }

        await tx.task.update({
          where: { id: taskId },
          data: { order: targetOrder },
        });
      } else {
        // Cross-column move
        const targetTasks = await tx.task.findMany({
          where: { columnId: targetColumnId },
          orderBy: { order: "asc" },
        });

        const clampedIndex = Math.max(0, Math.min(newIndex, targetTasks.length));

        // Shift target column tasks at and after insertion point
        for (let i = targetTasks.length - 1; i >= clampedIndex; i--) {
          await tx.task.update({
            where: { id: targetTasks[i]!.id },
            data: { order: i + 1 },
          });
        }

        // Update the moved task
        await tx.task.update({
          where: { id: taskId },
          data: {
            columnId: targetColumnId,
            order: clampedIndex,
          },
        });
      }
    });
  }
}
