/**
 * Sprint routes — mounted under /api/projects/:projectId/sprints.
 *
 * Mirrors milestone-routes.ts. Auth strategy is injected by the
 * test app (real session-based) and by src/app.ts (real session or
 * API key — deferred to PR D).
 */
import { Router } from "express";
import type { AuthStrategy } from "@shared/infrastructure/http/auth-middleware.js";
import { createAuthMiddleware } from "@shared/infrastructure/http/auth-middleware.js";
import type { SprintController } from "@sprints/interface/controllers/sprint-controller.js";

export const SPRINTS_ROUTES = {
  collection: "/:projectId/sprints",
  item: "/:projectId/sprints/:sprintId",
} as const;

export function createSprintRoutes(
  controller: SprintController,
  authStrategy: AuthStrategy,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.post(SPRINTS_ROUTES.collection, auth, controller.create);
  router.get(SPRINTS_ROUTES.collection, auth, controller.list);
  router.get(SPRINTS_ROUTES.item, auth, controller.get);
  router.patch(SPRINTS_ROUTES.item, auth, controller.update);
  router.delete(SPRINTS_ROUTES.item, auth, controller.delete);

  return router;
}