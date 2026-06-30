import type { TaskRepository } from "@tasks/domain/repositories/task-repository.js";
import { Task } from "@tasks/domain/entities/task.js";
import { AppError } from "@shared/infrastructure/http/error-handler.js";

export class DeleteTask {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new AppError(404, "Task not found");
    }

    // Get column tasks for reorder
    const columnTasks = await this.taskRepository.findByColumn(task.columnId);
    const deletedOrder = task.order;

    // Delete the task (Prisma cascade handles TaskTag cleanup)
    await this.taskRepository.delete(id);

    // Reorder remaining tasks in the column (fill the gap)
    const tasksToUpdate = columnTasks.filter(
      (t) => t.id !== id && t.order > deletedOrder,
    );

    for (const t of tasksToUpdate) {
      const reordered = new Task({
        id: t.id,
        columnId: t.columnId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        order: t.order - 1,
        assigneeId: t.assigneeId,
        creatorId: t.creatorId,
        createdAt: t.createdAt,
        updatedAt: new Date(),
      });
      await this.taskRepository.update(reordered);
    }
  }
}
