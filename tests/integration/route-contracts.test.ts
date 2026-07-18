import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { prisma } from "@/prisma.js";
import { clearDatabase } from "../helpers.js";

// The vitest backend config (vitest.config.ts) loads `.env.test` via
// tests/setup.ts and re-creates the SQLite database via tests/global-setup.ts,
// so by the time this file runs, NODE_ENV === "test" and DATABASE_URL points
// at prisma/test.db. We just need to call createApp() — Prisma is the same
// singleton the routes use, so this is a real end-to-end route contract.
import { createApp } from "@/app.js";

type Method = "get" | "post" | "put" | "patch" | "delete";

/**
 * Route contracts — regression test for #37 / #41.
 *
 * #37 root cause: two routing styles coexisting (some routers mounted at
 * `/api/<feature>` with internal paths starting with the feature prefix,
 * others mounted at `/api` with internal paths repeating the feature
 * prefix) led the developer to misroute POST /api/ instead of POST
 * /api/tasks. The result was a silent 404 from the MCP client.
 *
 * #41 unification: every router now uses the prefix-on-mount convention,
 * so internal paths start with `/` or a feature-specific sub-path but the
 * feature name appears exactly once in the effective URL.
 *
 * This test enumerates every public URL the API must serve and asserts
 * that hitting it returns anything OTHER than 404. A 401 (auth required)
 * or 400 (bad payload) is acceptable — both prove the route is
 * registered. A 404 means the route was not wired up, which is exactly
 * the failure mode #37 exposed.
 *
 * If you add a new public endpoint, add a row to the table below.
 */
describe("Route contracts (regression for #37 / #41)", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    app = createApp();
    await clearDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Each entry: [method, path, description]
  const routes: Array<[Method, string, string]> = [
    ["post", "/api/auth/register", "auth register"],
    ["post", "/api/auth/login", "auth login"],
    ["post", "/api/auth/logout", "auth logout"],
    ["get", "/api/auth/me", "auth me"],
    ["post", "/api/auth/rotate-api-key", "auth rotate"],
    ["get", "/api/projects", "list projects"],
    ["post", "/api/projects", "create project"],
    ["get", "/api/projects/:projectId/milestones", "list milestones"],
    ["get", "/api/projects/:projectId/milestones/:milestoneId", "get milestone by id"],
    ["post", "/api/projects/:projectId/milestones", "create milestone"],
    ["patch", "/api/projects/:projectId/milestones/:milestoneId", "update milestone"],
    ["delete", "/api/projects/:projectId/milestones/:milestoneId", "delete milestone"],
    ["post", "/api/projects/:projectId/milestones/:milestoneId/archive", "archive milestone"],
    ["get", "/api/projects/:projectId/sprints", "list sprints"],
    ["get", "/api/projects/:projectId/sprints/:sprintId", "get sprint by id"],
    ["post", "/api/projects/:projectId/sprints", "create sprint"],
    ["patch", "/api/projects/:projectId/sprints/:sprintId", "update sprint"],
    ["delete", "/api/projects/:projectId/sprints/:sprintId", "delete sprint"],
    ["get", "/api/boards/:projectId/board", "get board"],
    ["post", "/api/boards/:projectId/board", "create default board"],
    ["post", "/api/tasks", "create task"],
    ["patch", "/api/tasks/:id", "update task"],
    ["post", "/api/tasks/:id/move", "move task"],
    ["delete", "/api/tasks/:id", "delete task"],
    ["get", "/api/tags", "list tags"],
    ["post", "/api/tags", "create tag"],
    ["post", "/api/tags/tasks/:taskId/tags/:tagId", "assign tag to task"],
    ["delete", "/api/tags/tasks/:taskId/tags/:tagId", "unassign tag from task"],
  ];

  function call(method: Method, path: string): Promise<request.Response> {
    const agent = request(app);
    // Explicit dispatch — avoids the `Test` index-signature error that
    // `agent[method](...)` triggers under strict TS.
    switch (method) {
      case "get":    return agent.get(path).send({});
      case "post":   return agent.post(path).send({});
      case "put":    return agent.put(path).send({});
      case "patch":  return agent.patch(path).send({});
      case "delete": return agent.delete(path).send({});
    }
  }

  for (const [method, pathTemplate, description] of routes) {
    it(`${method.toUpperCase()} ${pathTemplate} is registered (${description})`, async () => {
      // Replace :param placeholders with a dummy value so the router
      // matches the route shape (the values themselves don't matter —
      // we expect 401, 400, or similar — never 404).
      const path = pathTemplate
        .replace(/:projectId/g, "test-project-id")
        .replace(/:id/g, "test-id")
        .replace(/:taskId/g, "test-task-id")
        .replace(/:tagId/g, "test-tag-id");

      const res = await call(method, path);

      // 401 (or 400 for bad payload) means the route is registered.
      // 404 means the route does NOT exist — this is the #37 failure mode.
      expect(
        res.status,
        `${method.toUpperCase()} ${path} should be registered (got ${res.status})`,
      ).not.toBe(404);
    });
  }
});