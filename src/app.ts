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
import { AUTH_ROUTES } from "@auth/domain/routes.js";
import { PrismaProjectRepository } from "@projects/infrastructure/persistence/prisma-project-repository.js";
import { CreateProject } from "@projects/application/use-cases/create-project.js";
import { ListProjects } from "@projects/application/use-cases/list-projects.js";
import { GetProject } from "@projects/application/use-cases/get-project.js";
import { UpdateProject } from "@projects/application/use-cases/update-project.js";
import { ArchiveProject } from "@projects/application/use-cases/archive-project.js";
import { ProjectController } from "@projects/interface/controllers/project-controller.js";
import { createProjectRoutes } from "@projects/interface/routes/project-routes.js";
import { PROJECTS_ROUTES } from "@projects/domain/routes.js";
import { PrismaBoardRepository } from "@boards/infrastructure/persistence/prisma-board-repository.js";
import { CreateDefaultBoard } from "@boards/application/use-cases/create-default-board.js";
import { GetBoard } from "@boards/application/use-cases/get-board.js";
import { BoardController } from "@boards/interface/controllers/board-controller.js";
import { createBoardRoutes } from "@boards/interface/routes/board-routes.js";
import { BOARD_ROUTES } from "@boards/domain/routes.js";
import { PrismaTaskRepository } from "@tasks/infrastructure/persistence/prisma-task-repository.js";
import { CreateTask } from "@tasks/application/use-cases/create-task.js";
import { UpdateTask } from "@tasks/application/use-cases/update-task.js";
import { MoveTask } from "@tasks/application/use-cases/move-task.js";
import { DeleteTask } from "@tasks/application/use-cases/delete-task.js";
import { TaskController } from "@tasks/interface/controllers/task-controller.js";
import { createTaskRoutes } from "@tasks/interface/routes/task-routes.js";
import { TASKS_ROUTES } from "@tasks/domain/routes.js";
import { PrismaTagRepository } from "@tags/infrastructure/persistence/prisma-tag-repository.js";
import { CreateTag } from "@tags/application/use-cases/create-tag.js";
import { ListTags } from "@tags/application/use-cases/list-tags.js";
import { AddTagToTask } from "@tags/application/use-cases/add-tag-to-task.js";
import { RemoveTagFromTask } from "@tags/application/use-cases/remove-tag-from-task.js";
import { TagController } from "@tags/interface/controllers/tag-controller.js";
import { createTagRoutes } from "@tags/interface/routes/tag-routes.js";
import { TAGS_ROUTES } from "@tags/domain/routes.js";
import { prisma } from "@/prisma.js";
import { PrismaMilestoneRepository } from "@milestones/infrastructure/persistence/prisma-milestone-repository.js";
import { MilestoneMembershipGuard } from "@milestones/application/membership-guard.js";
import { CreateMilestone } from "@milestones/application/use-cases/create-milestone.js";
import { ListMilestones } from "@milestones/application/use-cases/list-milestones.js";
import { GetMilestone } from "@milestones/application/use-cases/get-milestone.js";
import { UpdateMilestone } from "@milestones/application/use-cases/update-milestone.js";
import { DeleteMilestone } from "@milestones/application/use-cases/delete-milestone.js";
import { ArchiveMilestone } from "@milestones/application/use-cases/archive-milestone.js";
import { MilestoneController } from "@milestones/interface/controllers/milestone-controller.js";
import { createMilestoneRoutes } from "@milestones/interface/routes/milestone-routes.js";
import { MILESTONES_ROUTES } from "@milestones/domain/routes.js";
import { PrismaSprintRepository } from "@sprints/infrastructure/persistence/prisma-sprint-repository.js";
import { SprintMembershipGuard } from "@sprints/application/membership-guard.js";
import { CreateSprint } from "@sprints/application/use-cases/create-sprint.js";
import { ListSprints } from "@sprints/application/use-cases/list-sprints.js";
import { GetSprint } from "@sprints/application/use-cases/get-sprint.js";
import { UpdateSprint } from "@sprints/application/use-cases/update-sprint.js";
import { DeleteSprint } from "@sprints/application/use-cases/delete-sprint.js";
import { SprintController } from "@sprints/interface/controllers/sprint-controller.js";
import { createSprintRoutes } from "@sprints/interface/routes/sprint-routes.js";
import type { AuthUser } from "@shared/infrastructure/http/auth-middleware.js";
import type { Request } from "express";

const SQLiteStore = SQLiteStoreFactory(session);

const OFFLINE_USER_ID = "offline-user-id";

async function ensureOfflineUserExists(): Promise<void> {
  const exists = await prisma.user.findUnique({ where: { id: OFFLINE_USER_ID } });
  if (!exists) {
    await prisma.user.create({
      data: {
        id: OFFLINE_USER_ID,
        email: "offline@devtracker.local",
        name: "Offline User",
        passwordHash: "offline-mode-placeholder-hash",
        apiKey: null,
      },
    });
  }
}

function buildAuthStrategy(): (req: Request) => Promise<AuthUser | null> {
  const userRepo = new PrismaUserRepository(prisma);
  return async (req: Request): Promise<AuthUser | null> => {
    if (req.session?.userId) {
      const user = await userRepo.findById(req.session.userId);
      if (user) {
        return { id: user.id, email: user.email.value, name: user.name, apiKey: user.apiKey };
      }
    }
    const apiKey = req.headers["x-api-key"] as string | undefined;
    if (apiKey) {
      const user = await userRepo.findByApiKey(apiKey);
      if (user) {
        return { id: user.id, email: user.email.value, name: user.name, apiKey: user.apiKey };
      }
    }

    // MODO SIN AUTENTICACIÓN (OFFLINE/LOCAL POR DEFECTO)
    // Si no hay cookies de sesión ni API Key, la API devuelve el Offline User por defecto
    // cuando corre en desarrollo/producción para soportar modo local/offline sin login.
    // En entorno de tests (Vitest) se desactiva para validar correctamente las respuestas 401.
    if (!process.env.VITEST) {
      await ensureOfflineUserExists();
      return {
        id: OFFLINE_USER_ID,
        email: "offline@devtracker.local",
        name: "Offline User",
        apiKey: null,
      };
    }

    return null;
  };
}

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "10mb" }));

  app.use(
    session({
      store: new SQLiteStore({
        db: "sessions.db",
        dir: env.SESSIONS_DIR,
      }),
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: env.NODE_ENV === "production" ? "auto" : false,
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
  app.use(AUTH_ROUTES.base, createAuthRoutes(authController, authStrategy));

  // Projects module (fully wired)
  const prismaProjectRepo = new PrismaProjectRepository(prisma);
  const prismaBoardRepo = new PrismaBoardRepository(prisma);
  const projectController = new ProjectController(
    new CreateProject(prismaProjectRepo, prismaBoardRepo),
    new ListProjects(prismaProjectRepo),
    new GetProject(prismaProjectRepo),
    new UpdateProject(prismaProjectRepo),
    new ArchiveProject(prismaProjectRepo),
  );
  app.use(PROJECTS_ROUTES.base, createProjectRoutes(projectController, authStrategy));

  // Boards module (fully wired)
  const boardController = new BoardController(
    new CreateDefaultBoard(prismaBoardRepo),
    new GetBoard(prismaBoardRepo, prisma),
  );
  app.use(BOARD_ROUTES.base, createBoardRoutes(boardController, authStrategy));

  // Tasks module (fully wired)
  const prismaTaskRepo = new PrismaTaskRepository(prisma);
  const taskController = new TaskController(
    new CreateTask(prismaTaskRepo, prisma),
    new UpdateTask(prismaTaskRepo, prisma),
    new MoveTask(prismaTaskRepo, prisma),
    new DeleteTask(prismaTaskRepo),
  );
  app.use(TASKS_ROUTES.base, createTaskRoutes(taskController, authStrategy));

  // Tags module (fully wired)
  const prismaTagRepo = new PrismaTagRepository(prisma);
  const tagController = new TagController(
    new CreateTag(prismaTagRepo),
    new ListTags(prismaTagRepo),
    new AddTagToTask(prismaTagRepo),
    new RemoveTagFromTask(prismaTagRepo),
  );
  app.use(TAGS_ROUTES.base, createTagRoutes(tagController, authStrategy));

  // Milestones module (wired in PR D) — REST nested under /api/projects/:projectId/milestones
  // Mounted BEFORE sprints so the milestones router matches first for /:projectId/milestones/*.
  // Both share the same /api/projects base; Express routes by prefix and dispatches to
  // whichever router's path pattern matches the request.
  const prismaMilestoneRepo = new PrismaMilestoneRepository(prisma);
  const milestoneMembershipGuard = new MilestoneMembershipGuard(prisma);
  const milestoneController = new MilestoneController(
    new CreateMilestone(prismaMilestoneRepo, milestoneMembershipGuard, prisma),
    new ListMilestones(prismaMilestoneRepo, milestoneMembershipGuard, prisma),
    new GetMilestone(prismaMilestoneRepo, milestoneMembershipGuard, prisma),
    new UpdateMilestone(prismaMilestoneRepo, milestoneMembershipGuard, prisma),
    new DeleteMilestone(prismaMilestoneRepo, milestoneMembershipGuard, prisma),
    new ArchiveMilestone(prismaMilestoneRepo, milestoneMembershipGuard, prisma),
  );
  app.use(MILESTONES_ROUTES.base, createMilestoneRoutes(milestoneController, authStrategy));

  // Sprints module (wired in PR D) — REST nested under /api/projects/:projectId/sprints
  // SPRINTS_ROUTES only defines collection/item (no `base`); the base mount is hard-coded
  // here to match MILESTONES_ROUTES.base, since both routers are siblings under /api/projects.
  const SPRINTS_BASE = "/api/projects" as const;
  const prismaSprintRepo = new PrismaSprintRepository(prisma);
  const sprintMembershipGuard = new SprintMembershipGuard(prisma);
  const sprintController = new SprintController(
    new CreateSprint(prismaSprintRepo, sprintMembershipGuard, prisma),
    new ListSprints(prismaSprintRepo, sprintMembershipGuard, prisma),
    new GetSprint(prismaSprintRepo, sprintMembershipGuard, prisma),
    new UpdateSprint(prismaSprintRepo, sprintMembershipGuard, prisma),
    new DeleteSprint(prismaSprintRepo, sprintMembershipGuard, prisma),
  );
  app.use(SPRINTS_BASE, createSprintRoutes(sprintController, authStrategy));

  // Serve built Vue SPA from dist/client (no-op in dev mode where the file
  // doesn't exist). Without this, /projects returns a JSON 404 because the
  // production server has no SPA fallback. Required for E2E to load any
  // client route.
  app.use(express.static("dist/client"));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile("index.html", { root: "dist/client" });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
