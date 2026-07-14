import { Router } from 'express';
import { AuthController } from '@auth/interface/controllers/auth-controller.js';
import { createAuthMiddleware } from '@shared/infrastructure/http/auth-middleware.js';
import { validateBody } from '@shared/infrastructure/http/validate-middleware.js';
import { registerDtoSchema } from '@auth/application/dto/register-dto.js';
import type { AuthStrategy } from '@shared/infrastructure/http/auth-middleware.js';
import { AUTH_ROUTES } from '@auth/domain/routes.js';

export function createAuthRoutes(
  controller: AuthController,
  authStrategy: AuthStrategy
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.post(AUTH_ROUTES.register, validateBody(registerDtoSchema), controller.register);
  router.post(AUTH_ROUTES.login, controller.login);
  router.post(AUTH_ROUTES.logout, controller.logout);
  router.get(AUTH_ROUTES.me, auth, controller.me);
  router.post(AUTH_ROUTES.rotateApiKey, auth, controller.rotateApiKeyHandler);

  return router;
}

export { AUTH_ROUTES };