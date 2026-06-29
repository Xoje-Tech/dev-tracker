import type { Request, Response } from "express";

export class BoardController {
  get = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };

  createDefault = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };
}
