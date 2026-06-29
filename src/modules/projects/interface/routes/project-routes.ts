import { Router } from "express";
import { ProjectController } from "@projects/interface/controllers/project-controller.js";
import { createAuthMiddleware } from "@shared/infrastructure/http/auth-middleware.js";
import type { AuthStrategy } from "@shared/infrastructure/http/auth-middleware.js";

export function createProjectRoutes(
  controller: ProjectController,
  authStrategy: AuthStrategy,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.post("/", auth, controller.create);
  router.get("/", auth, controller.list);
  router.get("/:id", auth, controller.get);
  router.patch("/:id", auth, controller.update);
  router.post("/:id/archive", auth, controller.archive);

  return router;
}
