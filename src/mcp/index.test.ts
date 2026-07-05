import { describe, it, expect, vi } from "vitest";
import { setupServer } from "./index";

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => {
  return {
    Server: vi.fn().mockImplementation(function() {
      return {
        setRequestHandler: vi.fn(),
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

describe("MCP Server Setup", () => {
  it("initializes server without crashing", async () => {
    const server = setupServer();
    expect(server).toBeDefined();
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
