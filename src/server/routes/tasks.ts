import { Router } from "express";

export const tasksRouter = Router();

// POST /api/columns/:columnId/tasks
tasksRouter.post("/columns/:columnId/tasks", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// GET /api/tasks/:id
tasksRouter.get("/:id", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// PATCH /api/tasks/:id
tasksRouter.patch("/:id", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// DELETE /api/tasks/:id
tasksRouter.delete("/:id", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// POST /api/tasks/:id/move
tasksRouter.post("/:id/move", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});
