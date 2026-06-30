import type { Request, Response, NextFunction } from "express";
import type { CreateTask } from "@tasks/application/use-cases/create-task.js";
import type { UpdateTask } from "@tasks/application/use-cases/update-task.js";
import type { MoveTask } from "@tasks/application/use-cases/move-task.js";
import type { DeleteTask } from "@tasks/application/use-cases/delete-task.js";
import type { CreateTaskDto } from "@tasks/application/dto/create-task-dto.js";
import type { UpdateTaskDto } from "@tasks/application/dto/update-task-dto.js";
import type { MoveTaskDto } from "@tasks/application/dto/move-task-dto.js";

export class TaskController {
  constructor(
    private readonly createTask: CreateTask,
    private readonly updateTask: UpdateTask,
    private readonly moveTask: MoveTask,
    private readonly deleteTask: DeleteTask,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateTaskDto;
      const creatorId = req.user!.id;
      const result = await this.createTask.execute(dto, creatorId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const dto = req.body as UpdateTaskDto;
      const result = await this.updateTask.execute(id, dto);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  move = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const dto = req.body as MoveTaskDto;
      await this.moveTask.execute(id, dto);
      res.json({ message: "Task moved" });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.deleteTask.execute(id);
      res.json({ message: "Task deleted" });
    } catch (error) {
      next(error);
    }
  };
}
