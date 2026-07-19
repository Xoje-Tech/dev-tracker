/**
 * Sprint routes — mounted under /api/projects/:projectId/sprints.
 *
 * Mirrors milestone-routes.ts. The route paths are imported from
 * `domain/routes.ts` so the frontend can share the constants.
 */
import { Router } from "express";
import type { AuthStrategy } from "@shared/infrastructure/http/auth-middleware.js";
import { createAuthMiddleware } from "@shared/infrastructure/http/auth-middleware.js";
import type { SprintController } from "@sprints/interface/controllers/sprint-controller.js";
import { SPRINTS_ROUTES } from "@sprints/domain/routes.js";

export { SPRINTS_ROUTES };

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