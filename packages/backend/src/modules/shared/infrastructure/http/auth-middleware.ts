import type { Request, Response, NextFunction } from "express";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  apiKey: string | null;
}

export type AuthRequest = Request & { user?: AuthUser };

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export type AuthStrategy = (req: Request) => Promise<AuthUser | null> | AuthUser | null;

export function createAuthMiddleware(strategy: AuthStrategy) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await strategy(req);
      if (user) {
        (req as AuthRequest).user = user;
        next();
        return;
      }
      res.status(401).json({ error: "Unauthorized" });
    } catch {
      res.status(401).json({ error: "Unauthorized" });
    }
  };
}
