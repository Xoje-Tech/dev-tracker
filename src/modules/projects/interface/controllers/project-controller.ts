import type { Request, Response } from "express";

export class ProjectController {
  create = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };

  get = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };

  update = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };

  archive = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: "Not implemented" });
  };
}
