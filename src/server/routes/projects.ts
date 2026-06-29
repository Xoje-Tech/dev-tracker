import { Router } from "express";

export const projectsRouter = Router();

// GET /api/projects
projectsRouter.get("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// POST /api/projects
projectsRouter.post("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// GET /api/projects/:id
projectsRouter.get("/:id", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// PATCH /api/projects/:id
projectsRouter.patch("/:id", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// DELETE /api/projects/:id
projectsRouter.delete("/:id", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});
