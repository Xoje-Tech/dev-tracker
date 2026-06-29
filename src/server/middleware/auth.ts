import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma.js";

// Extend express-session's SessionData
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Extend Express Request with user property via declaration merging
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // 1. Check session-based auth
  if (req.session.userId) {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { id: true, email: true, name: true },
    });
    if (user) {
      req.user = user;
      next();
      return;
    }
  }

  // 2. Check API key auth
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey) {
    const user = await prisma.user.findUnique({
      where: { apiKey },
      select: { id: true, email: true, name: true },
    });
    if (user) {
      req.user = user;
      next();
      return;
    }
  }

  res.status(401).json({ error: "Unauthorized" });
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.session.userId) {
    prisma.user
      .findUnique({
        where: { id: req.session.userId },
        select: { id: true, email: true, name: true },
      })
      .then((user) => {
        if (user) req.user = user;
        next();
      })
      .catch(() => next());
  } else {
    next();
  }
}
