import type { AuthUser } from "./modules/shared/infrastructure/http/auth-middleware.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
