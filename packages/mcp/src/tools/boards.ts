/**
 * MCP tool registrations for the boards domain (2 tools).
 *
 * Naming convention (NFR): snake_case derived from the client method:
 *   boards.get             -> boards_get
 *   boards.createDefault   -> boards_create_default
 *
 * boards.get takes an input (projectId). boards.createDefault also
 * takes an input (projectId) — not a no-input tool.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DevTrackerClient } from "@dev-tracker/client";
import {
  getBoardInputSchema,
  createDefaultBoardInputSchema,
} from "@dev-tracker/client";
import { wrapInputTool, shapeOf } from "./_helpers.js";
import { isToolRegisteredAndTrack } from "../register.js";

export const BOARDS_TOOL_NAMES = [
  "boards_get",
  "boards_create_default",
] as const;

export type BoardsToolName = (typeof BOARDS_TOOL_NAMES)[number];

export function registerBoardsTools(
  server: McpServer,
  client: DevTrackerClient,
): void {
  const guard = isToolRegisteredAndTrack;

  if (guard("boards_get")) {
    server.tool(
      "boards_get",
      "Fetch the kanban board (columns + tasks) for a project.",
      shapeOf(getBoardInputSchema),
      wrapInputTool(client.boards.get),
    );
  }
  if (guard("boards_create_default")) {
    server.tool(
      "boards_create_default",
      "Create a default 3-column board (To Do, In Progress, Done) for a project that doesn't have one yet.",
      shapeOf(createDefaultBoardInputSchema),
      wrapInputTool(client.boards.createDefault),
    );
  }
}
