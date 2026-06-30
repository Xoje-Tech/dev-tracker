/**
 * MCP tool registrations for the auth domain (5 tools).
 *
 * Naming convention (NFR): snake_case derived from the client method:
 *   auth.register       -> auth_register
 *   auth.login          -> auth_login
 *   auth.logout         -> auth_logout           (no input)
 *   auth.me             -> auth_me               (no input)
 *   auth.rotateApiKey   -> auth_rotate_api_key   (no input)
 *
 * The orchestrator calls this function before projects/boards/tasks/
 * tags so the registration order is deterministic (NFR-3).
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DevTrackerClient } from "@dev-tracker/client";
import {
  registerInputSchema,
  loginInputSchema,
  emptyInputSchema,
} from "@dev-tracker/client";
import {
  wrapInputTool,
  wrapNoInputTool,
  shapeOf,
} from "./_helpers.js";
import { isToolRegisteredAndTrack } from "../register.js";

export const AUTH_TOOL_NAMES = [
  "auth_register",
  "auth_login",
  "auth_logout",
  "auth_me",
  "auth_rotate_api_key",
] as const;

export type AuthToolName = (typeof AUTH_TOOL_NAMES)[number];

export function registerAuthTools(
  server: McpServer,
  client: DevTrackerClient,
): void {
  const guard = isToolRegisteredAndTrack;

  if (guard("auth_register")) {
    server.tool(
      "auth_register",
      "Register a new user. Returns the user record and starts a session.",
      shapeOf(registerInputSchema),
      wrapInputTool(client.auth.register),
    );
  }
  if (guard("auth_login")) {
    server.tool(
      "auth_login",
      "Authenticate an existing user and start a session.",
      shapeOf(loginInputSchema),
      wrapInputTool(client.auth.login),
    );
  }
  // No-input tools use `registerTool` (the non-deprecated API) so we
  // can pass the full ZodObject and preserve `.strict()`. The
  // shape-based `server.tool(...)` overload drops `.strict()` because
  // it reconstructs the schema as `z.object(shape)`.
  if (guard("auth_logout")) {
    server.registerTool(
      "auth_logout",
      {
        description: "Destroy the current session.",
        inputSchema: emptyInputSchema,
      },
      wrapNoInputTool(client.auth.logout),
    );
  }
  if (guard("auth_me")) {
    server.registerTool(
      "auth_me",
      {
        description: "Return the currently authenticated user.",
        inputSchema: emptyInputSchema,
      },
      wrapNoInputTool(client.auth.me),
    );
  }
  if (guard("auth_rotate_api_key")) {
    server.registerTool(
      "auth_rotate_api_key",
      {
        description: "Generate a new API key for the current user.",
        inputSchema: emptyInputSchema,
      },
      wrapNoInputTool(client.auth.rotateApiKey),
    );
  }
}