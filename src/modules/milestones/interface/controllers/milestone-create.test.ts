import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import request from "supertest";
import express from "express";
import type { Express } from "express";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import { prisma } from "@/prisma.js";
import { clearDatabase } from "../../../../../tests/helpers.js";
import { errorHandler } from "@shared/infrastructure/http/error-handler.js";
import { PrismaMilestoneRepository } from "@milestones/infrastructure/persistence/prisma-milestone-repository.js";
import { MilestoneMembershipGuard } from "@milestones/application/membership-guard.js";
import { CreateMilestone } from "@milestones/application/use-cases/create-milestone.js";
import { MilestoneController } from "@milestones/interface/controllers/milestone-controller.js";
import { createMilestoneRoutes } from "@milestones/interface/routes/milestone-routes.js";

/**
 * End-to-end tests for the milestones create-milestone cluster.
 *
 * Test composition:
 *   - We assemble a real Express app in-memory: session middleware +
 *     a session-priming test route + the milestones router from
 *     createMilestoneRoutes + the shared error handler.
 *   - This deliberately does NOT touch src/app.ts — PR D wires the
 *     router into the global composition root. For now the integration
 *     scope is "router + controller + use cases + real SQLite", which
 *     is the full request/response pipeline minus the global app.
 *
 * Auth strategy:
 *   - The test-only /api/test/prime-session route accepts a userId and
 *     sets req.session.userId, returning a session cookie. This mirrors
 *     what /api/auth/login does in src/app.ts (session userId → auth
 *     middleware reads it), without dragging bcrypt into the test.
 *
 * RED proof: the file was committed BEFORE the create-milestone
 * implementation, so every test initially failed with 404. After the
 * GREEN commit lands, the cluster passes.
 */
describe("POST /api/projects/:projectId/milestones (create)", () => {
  let app: Express;

  // Stable creds for repeatable assertions.
  const OWNER = {
    email: "owner-milestones-create@test.com",
    name: "Milestones Create Owner",
  };
  const OUTSIDER = {
    email: "outsider-milestones-create@test.com",
    name: "Milestones Create Outsider",
  };

  let ownerUserId: string;
  let outsiderUserId: string;
  let ownerCookies: string;
  let outsiderCookies: string;
  let projectId: string;

  beforeAll(() => {
    // Build the in-memory app with the milestones router mounted. This
    // mirrors what PR D will do inside createApp().
    const SQLiteStore = SQLiteStoreFactory(session);
    app = express();
    app.set("trust proxy", 1);
    app.use(express.json());
    app.use(
      session({
        store: new SQLiteStore({
          db: "sessions-milestones-create.db",
          dir: process.cwd(),
        }),
        secret: "test-only-secret-not-for-production",
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false },
      }),
    );

    // Auth strategy: read userId from session. NO offline-mode fallback in
    // test — anonymous requests get 401.
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

    // TEST-ONLY session-priming route. Sets req.session.userId so the
    // auth middleware resolves the actor in subsequent requests. Never
    // mounted in production.
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

    const repo = new PrismaMilestoneRepository(prisma);
    const guard = new MilestoneMembershipGuard(prisma);
    const controller = new MilestoneController(
      new CreateMilestone(repo, guard, prisma),
    );

    app.use(
      "/api/projects",
      createMilestoneRoutes(controller, authStrategy),
    );

    app.use(errorHandler);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Seed users directly via Prisma. The placeholder passwordHash is
    // never used because the auth strategy reads userId from session.
    const owner = await prisma.user.create({
      data: {
        email: OWNER.email,
        name: OWNER.name,
        passwordHash: "test-hash-not-real",
      },
    });
    const outsider = await prisma.user.create({
      data: {
        email: OUTSIDER.email,
        name: OUTSIDER.name,
        passwordHash: "test-hash-not-real",
      },
    });
    ownerUserId = owner.id;
    outsiderUserId = outsider.id;

    // Create a project owned by `ownerUserId` and add ownerUserId as
    // ProjectMember with role "owner" — mirrors CreateProject.execute.
    const project = await prisma.project.create({
      data: {
        name: "Milestones Create Project",
        description: "For tests",
        members: { create: { userId: ownerUserId, role: "owner" } },
      },
    });
    projectId = project.id;

    // Prime sessions for both users via the test route. Cookies carry
    // the session id which the session middleware decodes back into
    // req.session.userId on every subsequent request.
    const primeOwner = await request(app)
      .post("/api/test/prime-session")
      .send({ userId: ownerUserId });
    expect(primeOwner.status).toBe(200);
    const ownerRaw = primeOwner.headers["set-cookie"];
    ownerCookies = Array.isArray(ownerRaw) ? ownerRaw.join("; ") : ownerRaw ?? "";

    const primeOutsider = await request(app)
      .post("/api/test/prime-session")
      .send({ userId: outsiderUserId });
    expect(primeOutsider.status).toBe(200);
    const outsiderRaw = primeOutsider.headers["set-cookie"];
    outsiderCookies = Array.isArray(outsiderRaw)
      ? outsiderRaw.join("; ")
      : outsiderRaw ?? "";
  });

  describe("happy path", () => {
    it("returns 201 with the created milestone body on success", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({
          title: "v1.0 GA",
          description: "First public release",
          dueDate: "2026-12-31T00:00:00.000Z",
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        projectId,
        title: "v1.0 GA",
        description: "First public release",
        status: "open",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      // Schema uses `targetDate`; the API contract exposes it as `dueDate`.
      expect(typeof res.body.dueDate).toBe("string");
      expect(new Date(res.body.dueDate).toISOString()).toBe(
        "2026-12-31T00:00:00.000Z",
      );
    });

    it("persists the milestone in the database with the expected fields", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "Persisted M", description: null });

      expect(res.status).toBe(201);
      const fromDb = await prisma.milestone.findUnique({
        where: { id: res.body.id },
      });
      expect(fromDb).not.toBeNull();
      expect(fromDb).toMatchObject({
        id: res.body.id,
        projectId,
        name: "Persisted M",
        description: null,
        status: "open",
      });
    });

    it("accepts a milestone with only the required title field", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "Minimal" });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Minimal");
      expect(res.body.description).toBeNull();
      expect(res.body.dueDate).toBeNull();
    });
  });

  describe("validation failures (400)", () => {
    it("rejects an empty title with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "" });

      expect(res.status).toBe(400);
    });

    it("rejects a whitespace-only title with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "   " });

      expect(res.status).toBe(400);
    });

    it("rejects a missing title with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ description: "no title" });

      expect(res.status).toBe(400);
    });

    it("rejects a malformed dueDate with 400", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "Bad date", dueDate: "not-a-date" });

      expect(res.status).toBe(400);
    });
  });

  describe("authorization failures", () => {
    it("returns 403 when the actor is not a ProjectMember", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .set("Cookie", outsiderCookies)
        .send({ title: "Sneaky" });

      expect(res.status).toBe(403);
    });

    it("returns 401 when no session cookie is provided", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/milestones`)
        .send({ title: "Anonymous" });

      expect(res.status).toBe(401);
    });

    it("returns 404 when the project does not exist", async () => {
      const res = await request(app)
        .post(`/api/projects/does-not-exist-id/milestones`)
        .set("Cookie", ownerCookies)
        .send({ title: "Ghost project" });

      expect(res.status).toBe(404);
    });
  });
});