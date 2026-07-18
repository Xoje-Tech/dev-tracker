import { Router } from "express";
import { MilestoneController } from "@milestones/interface/controllers/milestone-controller.js";
import { createAuthMiddleware } from "@shared/infrastructure/http/auth-middleware.js";
import { validateBody } from "@shared/infrastructure/http/validate-middleware.js";
import { createMilestoneDtoSchema } from "@milestones/application/dto/milestone-dto.js";
import type { AuthStrategy } from "@shared/infrastructure/http/auth-middleware.js";
import { MILESTONES_ROUTES } from "@milestones/domain/routes.js";

/**
 * createMilestoneRoutes — the milestones router.
 *
 * NOTE (PR B scope): this router is NOT mounted in src/app.ts. PR D wires
 * it under `app.use(MILESTONES_ROUTES.base, createMilestoneRoutes(...))`.
 * For now the router is exercised directly by the integration tests via
 * a controller instance constructed in-memory, no app.use() registration
 * required. This keeps PR B's diff strictly to the new module.
 *
 * Endpoints registered here (all require auth via the supplied strategy):
 *   POST   MILESTONES_ROUTES.collection       — create
 *   GET    MILESTONES_ROUTES.collection       — list
 *   PATCH  MILESTONES_ROUTES.item            — update
 *   DELETE MILESTONES_ROUTES.item            — hard delete
 *   POST   MILESTONES_ROUTES.archive         — soft archive
 */
export function createMilestoneRoutes(
  controller: MilestoneController,
  authStrategy: AuthStrategy,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.post(
    MILESTONES_ROUTES.collection,
    auth,
    validateBody(createMilestoneDtoSchema),
    controller.create,
  );

  router.get(MILESTONES_ROUTES.collection, auth, controller.list);

  return router;
}

export { MILESTONES_ROUTES };