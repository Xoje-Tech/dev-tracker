import { Router } from "express";

export const tagsRouter = Router();

// GET /api/tags
tagsRouter.get("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// POST /api/tags
tagsRouter.post("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// DELETE /api/tags/:id
tagsRouter.delete("/:id", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// POST /api/tasks/:taskId/tags
tagsRouter.post("/tasks/:taskId/tags", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// DELETE /api/tasks/:taskId/tags/:tagId
tagsRouter.delete("/tasks/:taskId/tags/:tagId", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});
