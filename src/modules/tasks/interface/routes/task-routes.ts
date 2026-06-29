import { Router } from "express";
import { TaskController } from "../controllers/task-controller.js";
import { createAuthMiddleware } from "../../../shared/infrastructure/http/auth-middleware.js";
import type { AuthStrategy } from "../../../shared/infrastructure/http/auth-middleware.js";

export function createTaskRoutes(
  controller: TaskController,
  authStrategy: AuthStrategy,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.post("/tasks", auth, controller.create);
  router.patch("/tasks/:id", auth, controller.update);
  router.post("/tasks/:id/move", auth, controller.move);
  router.delete("/tasks/:id", auth, controller.delete);

  return router;
}
