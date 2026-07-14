import { Router } from 'express';
import { TagController } from '@tags/interface/controllers/tag-controller.js';
import { createAuthMiddleware } from '@shared/infrastructure/http/auth-middleware.js';
import { validateBody } from '@shared/infrastructure/http/validate-middleware.js';
import { tagDtoSchema } from '@tags/application/dto/tag-dto.js';
import type { AuthStrategy } from '@shared/infrastructure/http/auth-middleware.js';
import { TAGS_ROUTES } from '@tags/domain/routes.js';

export function createTagRoutes(
  controller: TagController,
  authStrategy: AuthStrategy
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.post(TAGS_ROUTES.collection, auth, validateBody(tagDtoSchema), controller.create);
  router.get(TAGS_ROUTES.collection, auth, controller.list);
  router.post(TAGS_ROUTES.attach, auth, controller.addToTask);
  router.delete(TAGS_ROUTES.detach, auth, controller.removeFromTask);

  return router;
}

export { TAGS_ROUTES };