import type { Request, Response } from "express";

export class TagController {
  create = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };

  addToTask = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };

  removeFromTask = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };
}
