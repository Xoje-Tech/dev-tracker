#!/usr/bin/env node
/**
 * @dev-tracker/mcp — MCP server entry point.
 *
 * Wires the HTTP DevTrackerClient to an MCP server over stdio. All
 * logs go to stderr; stdout is reserved for JSON-RPC frames per the
 * MCP stdio transport contract.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  createDevTrackerClient,
  type DevTrackerClient,
} from "@dev-tracker/client";
import { registerTools } from "./register.js";

function log(msg: string): void {
  process.stderr.write(`[dev-tracker-mcp] ${msg}\n`);
}

/** Parse argv for `--transport <name>`; default "stdio". */
function parseTransport(argv: readonly string[]): string {
  const idx = argv.indexOf("--transport");
  if (idx === -1) return "stdio";
  const val = argv[idx + 1];
  return typeof val === "string" && val.length > 0 ? val : "stdio";
}

/**
 * Create the DevTrackerClient from environment variables. Throws on
 * missing config so the entry point can surface a clean error and
 * exit with code 2 (per MCP stdio convention).
 */
function createClientFromEnv(): DevTrackerClient {
  const apiKey = process.env["DEVTRACKER_API_KEY"];
  if (!apiKey || apiKey.length === 0) {
    throw new Error(
      "DEVTRACKER_API_KEY env var is required (set it before launching the server)",
    );
  }
  const baseUrl =
    process.env["DEVTRACKER_BASE_URL"] ?? "http://localhost:3000";
  return createDevTrackerClient({ transport: "http", baseUrl, apiKey });
}

async function main(): Promise<void> {
  const transport = parseTransport(process.argv);
  if (transport !== "stdio") {
    log(
      `unsupported transport "${transport}": only "stdio" is supported in this build`,
    );
    process.exit(2);
  }

  let client: DevTrackerClient;
  try {
    client = createClientFromEnv();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`config error: ${msg}`);
    process.exit(2);
  }

  const server = new McpServer({
    name: "dev-tracker",
    version: "1.0.0",
  });

  registerTools(server, client);

  const stdio = new StdioServerTransport();
  await server.connect(stdio);
  log("connected on stdio — ready for JSON-RPC frames");
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  log(`fatal: ${msg}`);
  process.exit(1);
});