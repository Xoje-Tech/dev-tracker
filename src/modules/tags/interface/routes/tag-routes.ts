import { Router } from "express";
import { TagController } from "@tags/interface/controllers/tag-controller.js";
import { createAuthMiddleware } from "@shared/infrastructure/http/auth-middleware.js";
import { validateBody } from "@shared/infrastructure/http/validate-middleware.js";
import { tagDtoSchema } from "@tags/application/dto/tag-dto.js";
import type { AuthStrategy } from "@shared/infrastructure/http/auth-middleware.js";

export function createTagRoutes(
  controller: TagController,
  authStrategy: AuthStrategy,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.post("/tags", auth, validateBody(tagDtoSchema), controller.create);
  router.get("/tags", auth, controller.list);
  router.post("/tasks/:taskId/tags/:tagId", auth, controller.addToTask);
  router.delete("/tasks/:taskId/tags/:tagId", auth, controller.removeFromTask);

  return router;
}
