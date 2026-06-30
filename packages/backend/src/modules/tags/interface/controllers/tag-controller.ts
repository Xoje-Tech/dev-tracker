import type { Request, Response, NextFunction } from "express";
import type { CreateTag } from "@tags/application/use-cases/create-tag.js";
import type { ListTags } from "@tags/application/use-cases/list-tags.js";
import type { AddTagToTask } from "@tags/application/use-cases/add-tag-to-task.js";
import type { RemoveTagFromTask } from "@tags/application/use-cases/remove-tag-from-task.js";
import type { TagDto } from "@tags/application/dto/tag-dto.js";

export class TagController {
  constructor(
    private readonly createTag: CreateTag,
    private readonly listTags: ListTags,
    private readonly addTagToTask: AddTagToTask,
    private readonly removeTagFromTask: RemoveTagFromTask,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as TagDto;
      const result = await this.createTag.execute(dto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listTags.execute();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  addToTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = req.params.taskId as string;
      const tagId = req.params.tagId as string;
      await this.addTagToTask.execute(taskId, tagId);
      res.json({ message: "Tag added to task" });
    } catch (error) {
      next(error);
    }
  };

  removeFromTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = req.params.taskId as string;
      const tagId = req.params.tagId as string;
      await this.removeTagFromTask.execute(taskId, tagId);
      res.json({ message: "Tag removed from task" });
    } catch (error) {
      next(error);
    }
  };
}
