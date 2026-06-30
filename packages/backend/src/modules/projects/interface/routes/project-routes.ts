import { Router } from "express";
import { ProjectController } from "@projects/interface/controllers/project-controller.js";
import { createAuthMiddleware } from "@shared/infrastructure/http/auth-middleware.js";
import { validateBody } from "@shared/infrastructure/http/validate-middleware.js";
import { createProjectDtoSchema } from "@projects/application/dto/create-project-dto.js";
import { updateProjectDtoSchema } from "@projects/application/dto/update-project-dto.js";
import type { AuthStrategy } from "@shared/infrastructure/http/auth-middleware.js";

export function createProjectRoutes(
  controller: ProjectController,
  authStrategy: AuthStrategy,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.post("/", auth, validateBody(createProjectDtoSchema), controller.create);
  router.get("/", auth, controller.list);
  router.get("/:id", auth, controller.get);
  router.patch("/:id", auth, validateBody(updateProjectDtoSchema), controller.update);
  router.post("/:id/archive", auth, controller.archive);

  return router;
}
