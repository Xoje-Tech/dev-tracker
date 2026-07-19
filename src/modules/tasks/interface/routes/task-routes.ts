import { Router } from 'express';
import { TaskController } from '@tasks/interface/controllers/task-controller.js';
import { createAuthMiddleware } from '@shared/infrastructure/http/auth-middleware.js';
import { validateBody } from '@shared/infrastructure/http/validate-middleware.js';
import { createTaskDtoSchema } from '@tasks/application/dto/create-task-dto.js';
import { updateTaskDtoSchema } from '@tasks/application/dto/update-task-dto.js';
import { moveTaskDtoSchema } from '@tasks/application/dto/move-task-dto.js';
import type { AuthStrategy } from '@shared/infrastructure/http/auth-middleware.js';
import { TASKS_ROUTES } from '@tasks/domain/routes.js';

export function createTaskRoutes(
  controller: TaskController,
  authStrategy: AuthStrategy
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.post(TASKS_ROUTES.collection, auth, validateBody(createTaskDtoSchema), controller.create);
  router.patch(TASKS_ROUTES.item, auth, validateBody(updateTaskDtoSchema), controller.update);
  router.post(TASKS_ROUTES.move, auth, validateBody(moveTaskDtoSchema), controller.move);
  router.delete(TASKS_ROUTES.item, auth, controller.delete);

  return router;
}

export { TASKS_ROUTES };