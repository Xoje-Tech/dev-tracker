import { Router } from "express";

export const boardRouter = Router();

// GET /api/projects/:projectId/board
boardRouter.get("/:projectId/board", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// POST /api/projects/:projectId/columns
boardRouter.post("/:projectId/columns", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// PATCH /api/columns/:id
boardRouter.patch("/columns/:id", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// DELETE /api/columns/:id
boardRouter.delete("/columns/:id", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});
