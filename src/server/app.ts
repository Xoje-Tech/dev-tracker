import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { boardRouter } from "./routes/board.js";
import { tasksRouter } from "./routes/tasks.js";
import { tagsRouter } from "./routes/tags.js";

const SQLiteStore = SQLiteStoreFactory(session);

export function createApp(): Express {
  const app = express();

  // Security & logging
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "10mb" }));

  // Session store
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
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    }),
  );

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Routes
  app.use("/api/auth", authRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api", boardRouter);
  app.use("/api", tasksRouter);
  app.use("/api", tagsRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
