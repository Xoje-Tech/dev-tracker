import type { Request, Response, NextFunction } from "express";
import type { CreateDefaultBoard } from "@boards/application/use-cases/create-default-board.js";
import type { GetBoard } from "@boards/application/use-cases/get-board.js";

export class BoardController {
  constructor(
    private readonly createDefaultBoard: CreateDefaultBoard,
    private readonly getBoard: GetBoard,
  ) {}

  createDefault = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const result = await this.createDefaultBoard.execute(projectId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const result = await this.getBoard.execute(projectId);
      if (!result) {
        res.status(404).json({ error: "Board not found" });
        return;
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
