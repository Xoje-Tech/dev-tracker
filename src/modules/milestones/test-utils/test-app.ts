import express from "express";
import type { Express } from "express";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import request from "supertest";
import { prisma } from "@/prisma.js";
import { errorHandler } from "@shared/infrastructure/http/error-handler.js";
import { PrismaMilestoneRepository } from "@milestones/infrastructure/persistence/prisma-milestone-repository.js";
import { MilestoneMembershipGuard } from "@milestones/application/membership-guard.js";
import { CreateMilestone } from "@milestones/application/use-cases/create-milestone.js";
import { ListMilestones } from "@milestones/application/use-cases/list-milestones.js";
import { UpdateMilestone } from "@milestones/application/use-cases/update-milestone.js";
import { MilestoneController } from "@milestones/interface/controllers/milestone-controller.js";
import { createMilestoneRoutes } from "@milestones/interface/routes/milestone-routes.js";

/**
 * buildMilestonesTestApp — assemble an in-memory Express app for
 * milestones integration tests.
 *
 * This deliberately does NOT touch src/app.ts — PR D wires the router
 * into the global composition root. For now the integration scope is
 * "router + controller + use cases + real SQLite + global error
 * handler", which is the full request/response pipeline minus the
 * global app.
 *
 * The app exposes:
 *   POST /api/projects/:projectId/milestones   (mounted milestones router)
 *   POST /api/test/prime-session               (TEST-ONLY session forge)
 *
 * The prime-session route exists solely so tests can establish an
 * authenticated session without going through bcrypt. It must NEVER
 * be mounted in production.
 */
export function buildMilestonesTestApp(
  controller: MilestoneController,
  sqliteFileName = "sessions-milestones-tests.db",
): Express {
  const SQLiteStore = SQLiteStoreFactory(session);
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(
    session({
      store: new SQLiteStore({
        db: sqliteFileName,
        dir: process.cwd(),
      }),
      secret: "test-only-secret-not-for-production",
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: false },
    }),
  );

  const authStrategy = async (
    req: express.Request,
  ): Promise<{ id: string; email: string; name: string; apiKey: string | null } | null> => {
    const sessionUserId = (req.session as { userId?: string } | undefined)
      ?.userId;
    if (sessionUserId) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
      });
      if (user) {
        return { id: user.id, email: user.email, name: user.name, apiKey: null };
      }
    }
    return null;
  };

  app.post("/api/test/prime-session", async (req, res) => {
    const { userId } = req.body as { userId?: string };
    if (!userId) {
      res.status(400).json({ error: "userId required" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "user not found" });
      return;
    }
    (req.session as { userId?: string }).userId = user.id;
    res.status(200).json({ id: user.id, email: user.email });
  });

  app.use(
    "/api/projects",
    createMilestoneRoutes(controller, authStrategy),
  );

  app.use(errorHandler);
  return app;
}

/**
 * defaultController — wires the production-default controller with the
 * real Prisma client. Use this for happy-path integration tests where
 * you don't need to mock the use case.
 */
export function defaultController(): MilestoneController {
  const repo = new PrismaMilestoneRepository(prisma);
  const guard = new MilestoneMembershipGuard(prisma);
  return new MilestoneController(
    new CreateMilestone(repo, guard, prisma),
    new ListMilestones(repo, guard, prisma),
    new UpdateMilestone(repo, guard, prisma),
  );
}

/**
 * primeSession — request a session cookie for a given userId via the
 * test-only /api/test/prime-session route.
 */
export async function primeSession(
  app: Express,
  userId: string,
): Promise<string> {
  const res = await request(app)
    .post("/api/test/prime-session")
    .send({ userId });
  if (res.status !== 200) {
    throw new Error(
      `primeSession failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  const cookies = res.headers["set-cookie"];
  if (!cookies) {
    throw new Error("primeSession did not return Set-Cookie");
  }
  return Array.isArray(cookies) ? cookies.join("; ") : cookies;
}

/**
 * seedUser — create a user via Prisma with a placeholder password hash.
 * The placeholder is never checked because the auth strategy reads
 * userId from session, not from credentials.
 */
export async function seedUser(
  email: string,
  name: string,
): Promise<string> {
  const user = await prisma.user.create({
    data: { email, name, passwordHash: "test-hash-not-real" },
  });
  return user.id;
}

/**
 * seedProjectWithMember — create a project and add a ProjectMember row
 * for the given owner. Mirrors CreateProject.execute() which creates
 * the member row inside the same transaction.
 */
export async function seedProjectWithMember(
  ownerUserId: string,
  name: string,
): Promise<string> {
  const project = await prisma.project.create({
    data: {
      name,
      description: "For tests",
      members: { create: { userId: ownerUserId, role: "owner" } },
    },
  });
  return project.id;
}