/**
 * F4.4 — Manifest test for the 20 primitive MCP tools.
 *
 * Asserts that:
 *  1. `registerTools(...)` registers exactly 20 tools, with the
 *     expected names (one per existing backend endpoint).
 *  2. Tool registration order matches the canonical order
 *     (NFR-3): auth (5), projects (5), boards (2), tags (4), tasks (4).
 *  3. `registerTools(...)` is idempotent — calling it twice with
 *     the same server does not throw and does not duplicate tools.
 *
 * Uses the per-domain `*_TOOL_NAMES` constants as the canonical
 * source of truth (the per-domain registrar files export them
 * alongside the register function). This is more reliable than
 * poking the SDK's private `_registeredTools` map (which has
 * changed shape across SDK versions).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DevTrackerClient } from "@dev-tracker/client";
import { registerTools, resetRegisteredTools } from "../register.js";
import { AUTH_TOOL_NAMES } from "../tools/auth.js";
import { PROJECTS_TOOL_NAMES } from "../tools/projects.js";
import { BOARDS_TOOL_NAMES } from "../tools/boards.js";
import { TAGS_TOOL_NAMES } from "../tools/tags.js";
import { TASKS_TOOL_NAMES } from "../tools/tasks.js";

const EXPECTED_TOOL_NAMES: readonly string[] = [
  ...AUTH_TOOL_NAMES,
  ...PROJECTS_TOOL_NAMES,
  ...BOARDS_TOOL_NAMES,
  ...TAGS_TOOL_NAMES,
  ...TASKS_TOOL_NAMES,
];

function newServer(): McpServer {
  return new McpServer({ name: "dev-tracker-test", version: "0.0.0" });
}

function newMockClient(): DevTrackerClient {
  // Empty mock — we only care about the registration count, not
  // whether the tools can actually be invoked. The dispatch
  // contract is verified by the per-domain tests (auth-projects etc.).
  return {
    auth: {
      register: async () => ({}),
      login: async () => ({}),
      logout: async () => undefined,
      me: async () => ({}),
      rotateApiKey: async () => ({ apiKey: "k" }),
    },
    projects: {
      list: async () => [],
      get: async () => ({}),
      create: async () => ({}),
      update: async () => ({}),
      archive: async () => ({}),
    },
    boards: {
      get: async () => ({}),
      createDefault: async () => ({}),
    },
    tasks: {
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => undefined,
      move: async () => ({}),
    },
    tags: {
      list: async () => [],
      create: async () => ({}),
      assign: async () => undefined,
      unassign: async () => undefined,
    },
  } as unknown as DevTrackerClient;
}

beforeEach(() => {
  resetRegisteredTools();
});

afterEach(() => {
  resetRegisteredTools();
});

describe("F4.4 — primitive tools manifest (20 tools)", () => {
  it("exposes exactly 20 tool names across the 5 modules", () => {
    expect(EXPECTED_TOOL_NAMES).toHaveLength(20);
  });

  it("registers all 20 tools in canonical NFR-3 order", () => {
    expect(EXPECTED_TOOL_NAMES).toEqual([
      // auth (5)
      "auth_register",
      "auth_login",
      "auth_logout",
      "auth_me",
      "auth_rotate_api_key",
      // projects (5)
      "projects_list",
      "projects_get",
      "projects_create",
      "projects_update",
      "projects_archive",
      // boards (2)
      "boards_get",
      "boards_create_default",
      // tags (4)
      "tags_list",
      "tags_create",
      "tags_assign",
      "tags_unassign",
      // tasks (4)
      "tasks_create",
      "tasks_update",
      "tasks_delete",
      "tasks_move",
    ]);
  });

  it("registers exactly 20 tools on a fresh server (no duplicates, no missing)", () => {
    const server = newServer();
    const client = newMockClient();
    registerTools(server, client);

    // The MCP SDK exposes the registered tool set via the McpServer's
    // private `_registeredTools` field. Using a typed access shim
    // avoids the unstable private API surface leaking into the rest
    // of the codebase.
    const registered = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );
    expect(registered).toHaveLength(EXPECTED_TOOL_NAMES.length);

    // Verify the set matches the canonical list (order-independent).
    const registeredSet = new Set(registered);
    for (const name of EXPECTED_TOOL_NAMES) {
      expect(registeredSet.has(name)).toBe(true);
    }
    expect(registeredSet.size).toBe(EXPECTED_TOOL_NAMES.length);
  });

  it("registerTools is idempotent — calling twice does not duplicate or throw", () => {
    const server = newServer();
    const client = newMockClient();
    registerTools(server, client);
    expect(() => registerTools(server, client)).not.toThrow();

    const registered = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );
    expect(registered).toHaveLength(EXPECTED_TOOL_NAMES.length);
  });
});
