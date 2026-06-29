import type { Request, Response } from "express";

export class TaskController {
  create = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };

  update = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };

  move = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };

  delete = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };
}
