import type { AuthUser } from "@shared/infrastructure/http/auth-middleware.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
