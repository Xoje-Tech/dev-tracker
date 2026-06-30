/**
 * F4.2 — Tests for the auth (5) and projects (5) primitive tool
 * registrations.
 *
 * Pattern: build a mock DevTrackerClient (vi.fn per method), build a
 * real McpServer from the SDK, exercise each tool through the SDK's
 * `tools/call` request handler so we hit the full validation → wrap
 * → client → response path. The SDK is the system under test here,
 * not the handler we wrote.
 *
 * For each tool we assert:
 *   (a) valid input → the right client method is called once with
 *       the expected payload, and the handler returns a successful
 *       CallToolResult whose JSON-encoded text equals the mock's
 *       return value.
 *   (b) invalid input (missing required field, wrong type) → the
 *       client method is NEVER called and the handler returns an
 *       MCP error result (isError: true).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import type {
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { DevTrackerClient } from "@dev-tracker/client";
import {
  registerAuthTools,
  AUTH_TOOL_NAMES,
} from "../tools/auth.js";
import {
  registerProjectsTools,
  PROJECTS_TOOL_NAMES,
} from "../tools/projects.js";
import {
  isToolRegistered,
  resetRegisteredTools,
} from "../register.js";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Invoke a tool through the SDK's `tools/call` request handler — the
 * same path an MCP client uses over stdio / SSE. We grab the handler
 * from the underlying `Server`'s private `_requestHandlers` map; this
 * is a private API but it's the only way to exercise the SDK's full
 * validation pipeline (Zod parse → handler invocation → output
 * shaping) without standing up a transport + client pair.
 */
async function callTool(
  server: McpServer,
  name: string,
  args: Record<string, unknown> = {},
): Promise<CallToolResult> {
  // Force the SDK to initialise its internal handlers (it lazily
  // wires `tools/list` and `tools/call` on first registration).
  // Triggering `server.tool` for a sentinel below would double-register;
  // instead we just call `tools/list` to flush, then grab the handler.
  // The SDK sets handlers on the first `_createRegisteredTool` call,
  // which happens inside `server.tool(...)` in our registrars. So by
  // the time we get here, the handler is registered.
  const protocol = (server as unknown as { server: unknown }).server as unknown as {
    _requestHandlers: Map<string, (req: unknown, extra: unknown) => Promise<CallToolResult>>;
  };
  const handler = protocol._requestHandlers.get("tools/call");
  if (!handler) {
    throw new Error(
      "tools/call handler not registered — did you call register*Tools first?",
    );
  }
  const extra = {
    signal: new AbortController().signal,
    sessionId: undefined as string | undefined,
    sendNotification: async (): Promise<void> => undefined,
    sendRequest: async (): Promise<unknown> => {
      throw new Error("sendRequest not supported in tests");
    },
  };
  try {
    return await handler(
      { method: "tools/call", params: { name, arguments: args } },
      extra,
    );
  } catch (err) {
    // The SDK's wrappedHandler re-validates the output against
    // CallToolResultSchema; if our toErrorResult is fed an error
    // whose .message is empty (e.g. a ZodError issue list without
    // a top-level message), the output validation throws an
    // McpError instead of returning our isError result. Capture
    // McpError and surface it as an isError result so tests can
    // assert uniformly on the same shape (matches what an MCP
    // client would see over the wire after JSON-RPC wrapping).
    if (err instanceof McpError) {
      return {
        isError: true,
        content: [{ type: "text", text: `${err.name}: ${err.message}` }],
      };
    }
    throw err;
  }
}

interface MockClient {
  client: DevTrackerClient;
  mocks: {
    auth_register: ReturnType<typeof vi.fn>;
    auth_login: ReturnType<typeof vi.fn>;
    auth_logout: ReturnType<typeof vi.fn>;
    auth_me: ReturnType<typeof vi.fn>;
    auth_rotate_api_key: ReturnType<typeof vi.fn>;
    projects_list: ReturnType<typeof vi.fn>;
    projects_get: ReturnType<typeof vi.fn>;
    projects_create: ReturnType<typeof vi.fn>;
    projects_update: ReturnType<typeof vi.fn>;
    projects_archive: ReturnType<typeof vi.fn>;
  };
}

function buildMockClient(): MockClient {
  const auth_register = vi.fn();
  const auth_login = vi.fn();
  const auth_logout = vi.fn();
  const auth_me = vi.fn();
  const auth_rotate_api_key = vi.fn();
  const projects_list = vi.fn();
  const projects_get = vi.fn();
  const projects_create = vi.fn();
  const projects_update = vi.fn();
  const projects_archive = vi.fn();

  const client = {
    auth: {
      register: auth_register,
      login: auth_login,
      logout: auth_logout,
      me: auth_me,
      rotateApiKey: auth_rotate_api_key,
    },
    projects: {
      list: projects_list,
      get: projects_get,
      create: projects_create,
      update: projects_update,
      archive: projects_archive,
    },
    boards: {
      get: vi.fn(),
      createDefault: vi.fn(),
    },
    tasks: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      move: vi.fn(),
    },
    tags: {
      list: vi.fn(),
      create: vi.fn(),
      assign: vi.fn(),
      unassign: vi.fn(),
    },
  } as unknown as DevTrackerClient;

  return {
    client,
    mocks: {
      auth_register,
      auth_login,
      auth_logout,
      auth_me,
      auth_rotate_api_key,
      projects_list,
      projects_get,
      projects_create,
      projects_update,
      projects_archive,
    },
  };
}

function newServer(): McpServer {
  return new McpServer({ name: "dev-tracker-test", version: "0.0.0" });
}

/** Assert the result is a successful (non-error) CallToolResult. */
function expectSuccess(result: CallToolResult, expected: unknown): void {
  expect(result.isError).toBeUndefined();
  expect(Array.isArray(result.content)).toBe(true);
  expect(result.content).toHaveLength(1);
  const block = result.content?.[0];
  expect(block?.type).toBe("text");
  const text = (block as { type: "text"; text: string }).text;
  expect(JSON.parse(text)).toEqual(expected);
}

/** Assert the result is an MCP error result. */
function expectError(result: CallToolResult): void {
  expect(result.isError).toBe(true);
  expect(Array.isArray(result.content)).toBe(true);
  expect(result.content?.[0]?.type).toBe("text");
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

beforeEach(() => {
  resetRegisteredTools();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("F4.2 — auth tools (5)", () => {
  it("registers exactly the 5 expected tool names in the right order", () => {
    const { client } = buildMockClient();
    const server = newServer();
    registerAuthTools(server, client);
    for (const name of AUTH_TOOL_NAMES) {
      expect(isToolRegistered(name)).toBe(true);
    }
    expect(AUTH_TOOL_NAMES).toEqual([
      "auth_register",
      "auth_login",
      "auth_logout",
      "auth_me",
      "auth_rotate_api_key",
    ]);
  });

  describe("auth_register", () => {
    it("calls client.auth.register with the validated input and returns success", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerAuthTools(server, client);
      const user = { id: "u1", email: "a@b.co", name: "Alice", apiKey: "k" };
      mocks.auth_register.mockResolvedValueOnce(user);

      const result = await callTool(server, "auth_register", {
        email: "a@b.co",
        password: "secret123",
        name: "Alice",
      });

      expect(mocks.auth_register).toHaveBeenCalledTimes(1);
      expect(mocks.auth_register).toHaveBeenCalledWith({
        email: "a@b.co",
        password: "secret123",
        name: "Alice",
      });
      expectSuccess(result, user);
    });

    it("returns an MCP error and does NOT call the client when input is missing required fields", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerAuthTools(server, client);

      const result = await callTool(server, "auth_register", {
        email: "a@b.co",
        // password + name missing
      });

      expect(mocks.auth_register).not.toHaveBeenCalled();
      expectError(result);
    });

    it("returns an MCP error and does NOT call the client when types are wrong", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerAuthTools(server, client);

      const result = await callTool(server, "auth_register", {
        email: 123, // wrong type
        password: "pw",
        name: "Alice",
      });

      expect(mocks.auth_register).not.toHaveBeenCalled();
      expectError(result);
    });
  });

  describe("auth_login", () => {
    it("calls client.auth.login with validated input", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerAuthTools(server, client);
      const user = { id: "u1", email: "a@b.co", name: "Alice", apiKey: "k" };
      mocks.auth_login.mockResolvedValueOnce(user);

      const result = await callTool(server, "auth_login", {
        email: "a@b.co",
        password: "secret123",
      });

      expect(mocks.auth_login).toHaveBeenCalledWith({
        email: "a@b.co",
        password: "secret123",
      });
      expectSuccess(result, user);
    });

    it("does NOT call the client on missing password", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerAuthTools(server, client);

      const result = await callTool(server, "auth_login", { email: "a@b.co" });

      expect(mocks.auth_login).not.toHaveBeenCalled();
      expectError(result);
    });
  });

  describe("auth_logout", () => {
    it("calls client.auth.logout() with no args and returns success", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerAuthTools(server, client);
      mocks.auth_logout.mockResolvedValueOnce({ ok: true });

      const result = await callTool(server, "auth_logout");

      expect(mocks.auth_logout).toHaveBeenCalledTimes(1);
      expect(mocks.auth_logout).toHaveBeenCalledWith();
      expectSuccess(result, { ok: true });
    });

    it("does NOT call the client when arguments are not an object", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerAuthTools(server, client);
      // strict() should reject unknown keys
      const result = await callTool(server, "auth_logout", { foo: "bar" });

      expect(mocks.auth_logout).not.toHaveBeenCalled();
      expectError(result);
    });
  });

  describe("auth_me", () => {
    it("calls client.auth.me() and returns success", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerAuthTools(server, client);
      const user = { id: "u1", email: "a@b.co", name: "Alice", apiKey: "k" };
      mocks.auth_me.mockResolvedValueOnce(user);

      const result = await callTool(server, "auth_me");

      expect(mocks.auth_me).toHaveBeenCalledTimes(1);
      expect(mocks.auth_me).toHaveBeenCalledWith();
      expectSuccess(result, user);
    });
  });

  describe("auth_rotate_api_key", () => {
    it("calls client.auth.rotateApiKey() and returns success", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerAuthTools(server, client);
      const rotated = { apiKey: "new-key-xyz" };
      mocks.auth_rotate_api_key.mockResolvedValueOnce(rotated);

      const result = await callTool(server, "auth_rotate_api_key");

      expect(mocks.auth_rotate_api_key).toHaveBeenCalledTimes(1);
      expect(mocks.auth_rotate_api_key).toHaveBeenCalledWith();
      expectSuccess(result, rotated);
    });
  });
});

describe("F4.2 — projects tools (5)", () => {
  it("registers exactly the 5 expected tool names in the right order", () => {
    const { client } = buildMockClient();
    const server = newServer();
    registerProjectsTools(server, client);
    for (const name of PROJECTS_TOOL_NAMES) {
      expect(isToolRegistered(name)).toBe(true);
    }
    expect(PROJECTS_TOOL_NAMES).toEqual([
      "projects_list",
      "projects_get",
      "projects_create",
      "projects_update",
      "projects_archive",
    ]);
  });

  describe("projects_list", () => {
    it("calls client.projects.list with the validated input", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerProjectsTools(server, client);
      const list = [{ id: "p1", name: "P", description: null, archived: false, createdAt: "", updatedAt: "", role: "owner" }];
      mocks.projects_list.mockResolvedValueOnce(list);

      const result = await callTool(server, "projects_list", {});

      expect(mocks.projects_list).toHaveBeenCalledTimes(1);
      expect(mocks.projects_list).toHaveBeenCalledWith({});
      expectSuccess(result, list);
    });

    it("does NOT call the client when arguments contain unknown keys", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerProjectsTools(server, client);
      const result = await callTool(server, "projects_list", { bad: "key" });

      expect(mocks.projects_list).not.toHaveBeenCalled();
      expectError(result);
    });
  });

  describe("projects_get", () => {
    it("calls client.projects.get with the id", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerProjectsTools(server, client);
      const proj = { id: "p1", name: "P", description: null, archived: false, createdAt: "", updatedAt: "", role: "owner" };
      mocks.projects_get.mockResolvedValueOnce(proj);

      const result = await callTool(server, "projects_get", { id: "p1" });

      expect(mocks.projects_get).toHaveBeenCalledWith({ id: "p1" });
      expectSuccess(result, proj);
    });

    it("does NOT call the client when id is missing", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerProjectsTools(server, client);
      const result = await callTool(server, "projects_get", {});

      expect(mocks.projects_get).not.toHaveBeenCalled();
      expectError(result);
    });
  });

  describe("projects_create", () => {
    it("calls client.projects.create with the validated input", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerProjectsTools(server, client);
      const proj = { id: "p1", name: "New", description: "d", archived: false, createdAt: "", updatedAt: "", role: "owner" };
      mocks.projects_create.mockResolvedValueOnce(proj);

      const result = await callTool(server, "projects_create", {
        name: "New",
        description: "d",
      });

      expect(mocks.projects_create).toHaveBeenCalledWith({
        name: "New",
        description: "d",
      });
      expectSuccess(result, proj);
    });

    it("does NOT call the client when name is empty string (min(1) fails)", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerProjectsTools(server, client);
      const result = await callTool(server, "projects_create", { name: "" });

      expect(mocks.projects_create).not.toHaveBeenCalled();
      expectError(result);
    });
  });

  describe("projects_update", () => {
    it("calls client.projects.update with the validated input", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerProjectsTools(server, client);
      const proj = { id: "p1", name: "Updated", description: null, archived: false, createdAt: "", updatedAt: "", role: "owner" };
      mocks.projects_update.mockResolvedValueOnce(proj);

      const result = await callTool(server, "projects_update", {
        id: "p1",
        name: "Updated",
      });

      expect(mocks.projects_update).toHaveBeenCalledWith({
        id: "p1",
        name: "Updated",
      });
      expectSuccess(result, proj);
    });

    it("does NOT call the client when id is missing", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerProjectsTools(server, client);
      const result = await callTool(server, "projects_update", { name: "x" });

      expect(mocks.projects_update).not.toHaveBeenCalled();
      expectError(result);
    });
  });

  describe("projects_archive", () => {
    it("calls client.projects.archive with the id", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerProjectsTools(server, client);
      const proj = { id: "p1", name: "P", description: null, archived: true, createdAt: "", updatedAt: "", role: "owner" };
      mocks.projects_archive.mockResolvedValueOnce(proj);

      const result = await callTool(server, "projects_archive", { id: "p1" });

      expect(mocks.projects_archive).toHaveBeenCalledWith({ id: "p1" });
      expectSuccess(result, proj);
    });

    it("does NOT call the client when id is wrong type", async () => {
      const { client, mocks } = buildMockClient();
      const server = newServer();
      registerProjectsTools(server, client);
      const result = await callTool(server, "projects_archive", { id: 123 });

      expect(mocks.projects_archive).not.toHaveBeenCalled();
      expectError(result);
    });
  });
});