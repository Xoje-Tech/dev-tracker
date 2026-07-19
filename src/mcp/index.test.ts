import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupServer } from "./index";

/**
 * Captures handlers passed to the SDK Server mock keyed by the MCP method
 * literal they handle. The MCP schemas expose their discriminator under
 * `shape.method._def.values[0]` (Zod 4 internal layout); we extract that
 * to map a ListToolsRequestSchema → "tools/list" → handler.
 */
const capturedHandlers = new Map<
  string,
  () => Promise<{ tools: Array<{ name: string }> }> | { tools: Array<{ name: string }> }
>();

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => {
  return {
    Server: vi.fn().mockImplementation(function() {
      return {
        setRequestHandler: vi.fn((schema: unknown, handler: () => Promise<{ tools: Array<{ name: string }> }> | { tools: Array<{ name: string }> }) => {
          // Extract the MCP method literal from the Zod 4 schema.
          // shape.method._def.values is an array of allowed literals;
          // for ListToolsRequestSchema it is ["tools/list"].
          const methodShape = (schema as {
            shape?: { method?: { _def?: { values?: unknown[] } } };
          })?.shape?.method;
          const values = methodShape?._def?.values;
          const method = Array.isArray(values) ? String(values[0] ?? "") : "";
          if (method) capturedHandlers.set(method, handler);
        }),
        connect: vi.fn(),
      };
    })
  };
});

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => {
  return {
    StdioServerTransport: vi.fn().mockImplementation(function() {
      return {};
    })
  };
});

beforeEach(() => {
  capturedHandlers.clear();
});

describe("MCP Server Setup", () => {
  it("initializes server without crashing", async () => {
    const server = setupServer();
    expect(server).toBeDefined();
  });

  it("advertises exactly 18 tools (7 baseline + 6 milestones + 5 sprints)", async () => {
    // Phase 3 acceptance criterion: surface grows from 7 to 18.
    setupServer();
    const handler = capturedHandlers.get("tools/list");
    expect(handler).toBeDefined();
    const response = await handler!();
    const names = response.tools.map((t) => t.name).sort();
    expect(names).toHaveLength(18);
    expect(names).toEqual(
      [
        "archive_milestone",
        "create_milestone",
        "create_project",
        "create_sprint",
        "create_task",
        "delete_milestone",
        "delete_sprint",
        "delete_task",
        "get_milestone",
        "get_project_board",
        "get_sprint",
        "list_milestones",
        "list_projects",
        "list_sprints",
        "move_task",
        "update_milestone",
        "update_sprint",
        "update_task",
      ].sort(),
    );
  });
});

import { run } from "./index";

describe("MCP Server run", () => {
  it("redirects console.log to console.error", async () => {
    const originalLog = console.log;
    try {
      await run();
      expect(console.log).toBe(console.error);
    } finally {
      console.log = originalLog;
    }
  });
});