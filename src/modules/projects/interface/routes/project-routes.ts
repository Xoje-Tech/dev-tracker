import { Router } from 'express';
import type { AuthStrategy } from '@shared/infrastructure/http/auth-middleware.js';
import { ProjectController } from '@projects/interface/controllers/project-controller.js';
import { createProjectDtoSchema } from '@projects/application/dto/create-project-dto.js';
import { updateProjectDtoSchema } from '@projects/application/dto/update-project-dto.js';
import { validateBody } from '@shared/infrastructure/http/validate-middleware.js';
import { createAuthMiddleware } from '@shared/infrastructure/http/auth-middleware.js';
import { PROJECTS_ROUTES } from '@projects/domain/routes.js';

export function createProjectRoutes(
  controller: ProjectController,
  authStrategy: AuthStrategy
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.post(PROJECTS_ROUTES.collection, auth, validateBody(createProjectDtoSchema), controller.create);
  router.get(PROJECTS_ROUTES.collection, auth, controller.list);
  router.get(PROJECTS_ROUTES.item, auth, controller.get);
  router.get(PROJECTS_ROUTES.memories, auth, controller.getMemories);
  router.patch(PROJECTS_ROUTES.item, auth, validateBody(updateProjectDtoSchema), controller.update);
  router.post(PROJECTS_ROUTES.archive, auth, controller.archive);

  return router;
}

export { PROJECTS_ROUTES };