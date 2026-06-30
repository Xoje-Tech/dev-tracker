/**
 * Factory for the McpServer. Tool registration is intentionally
 * NOT done here — that's the orchestrator's job (see `register.ts`).
 * Splitting factory from registration keeps the server construction
 * independent of which tools a caller wants registered (useful for
 * the manifest test that asserts the full 22-tool set).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createMcpServer(): McpServer {
  return new McpServer({
    name: "dev-tracker",
    version: "1.0.0",
  });
}