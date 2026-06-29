import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import { env } from "@config/env.js";
import { errorHandler, notFoundHandler } from "@shared/infrastructure/http/error-handler.js";
import { PrismaUserRepository } from "@auth/infrastructure/persistence/prisma-user-repository.js";
import { RegisterUser } from "@auth/application/use-cases/register-user.js";
import { AuthenticateUser } from "@auth/application/use-cases/authenticate-user.js";
import { RotateApiKey } from "@auth/application/use-cases/rotate-api-key.js";
import { AuthController } from "@auth/interface/controllers/auth-controller.js";
import { createAuthRoutes } from "@auth/interface/routes/auth-routes.js";
import { ProjectController } from "@projects/interface/controllers/project-controller.js";
import { createProjectRoutes } from "@projects/interface/routes/project-routes.js";
import { BoardController } from "@boards/interface/controllers/board-controller.js";
import { createBoardRoutes } from "@boards/interface/routes/board-routes.js";
import { TaskController } from "@tasks/interface/controllers/task-controller.js";
import { createTaskRoutes } from "@tasks/interface/routes/task-routes.js";
import { TagController } from "@tags/interface/controllers/tag-controller.js";
import { createTagRoutes } from "@tags/interface/routes/tag-routes.js";
import { prisma } from "@/prisma.js";
import type { AuthUser } from "@shared/infrastructure/http/auth-middleware.js";
import type { Request } from "express";

const SQLiteStore = SQLiteStoreFactory(session);

function buildAuthStrategy(): (req: Request) => Promise<AuthUser | null> {
  const userRepo = new PrismaUserRepository(prisma);
  return async (req: Request): Promise<AuthUser | null> => {
    if (req.session?.userId) {
      const user = await userRepo.findById(req.session.userId);
      if (user) {
        return { id: user.id, email: user.email.value, name: user.name };
      }
    }
    const apiKey = req.headers["x-api-key"] as string | undefined;
    if (apiKey) {
      const user = await userRepo.findByApiKey(apiKey);
      if (user) {
        return { id: user.id, email: user.email.value, name: user.name };
      }
    }
    return null;
  };
}

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "10mb" }));

  app.use(
    session({
      store: new SQLiteStore({
        db: "sessions.db",
        dir: ".",
      }),
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth module (fully wired)
  const prismaUserRepo = new PrismaUserRepository(prisma);
  const authStrategy = buildAuthStrategy();
  const authController = new AuthController(
    new RegisterUser(prismaUserRepo),
    new AuthenticateUser(prismaUserRepo),
    new RotateApiKey(prismaUserRepo),
  );
  app.use("/api/auth", createAuthRoutes(authController, authStrategy));

  // Other modules (stubs — scaffold only)
  app.use("/api/projects", createProjectRoutes(new ProjectController(), authStrategy));
  app.use("/api", createBoardRoutes(new BoardController(), authStrategy));
  app.use("/api", createTaskRoutes(new TaskController(), authStrategy));
  app.use("/api", createTagRoutes(new TagController(), authStrategy));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
