import { Router } from "express";
import { AuthController } from "@auth/interface/controllers/auth-controller.js";
import { createAuthMiddleware } from "@shared/infrastructure/http/auth-middleware.js";
import { validateBody } from "@shared/infrastructure/http/validate-middleware.js";
import { registerDtoSchema } from "@auth/application/dto/register-dto.js";
import type { AuthStrategy } from "@shared/infrastructure/http/auth-middleware.js";

export function createAuthRoutes(
  controller: AuthController,
  authStrategy: AuthStrategy,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStrategy);

  router.post("/register", validateBody(registerDtoSchema), controller.register);
  router.post("/login", controller.login);
  router.post("/logout", controller.logout);
  router.get("/me", auth, controller.me);
  router.post("/rotate-api-key", auth, controller.rotateApiKeyHandler);

  return router;
}
