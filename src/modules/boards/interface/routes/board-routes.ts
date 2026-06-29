import { Router } from "express";
import { BoardController } from "../controllers/board-controller.js";
import { createAuthMiddleware } from "../../../shared/infrastructure/http/auth-middleware.js";
import type { AuthStrategy } from "../../../shared/infrastructure/http/auth-middleware.js";

export function createBoardRoutes(
  controller: BoardController,
  authStrategy: AuthStrategy,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.get("/projects/:projectId/board", auth, controller.get);
  router.post("/projects/:projectId/board", auth, controller.createDefault);

  return router;
}
