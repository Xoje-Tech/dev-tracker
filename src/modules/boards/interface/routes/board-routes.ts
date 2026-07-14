import { Router } from 'express';
import { BoardController } from '@boards/interface/controllers/board-controller.js';
import { createAuthMiddleware } from '@shared/infrastructure/http/auth-middleware.js';
import type { AuthStrategy } from '@shared/infrastructure/http/auth-middleware.js';
import { BOARD_ROUTES } from '@boards/domain/routes.js';

export function createBoardRoutes(
  controller: BoardController,
  authStrategy: AuthStrategy
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.get(BOARD_ROUTES.get, auth, controller.get);
  router.post(BOARD_ROUTES.createDefault, auth, controller.createDefault);

  return router;
}

export { BOARD_ROUTES };