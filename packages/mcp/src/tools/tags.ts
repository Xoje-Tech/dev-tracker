/**
 * MCP tool registrations for the tags domain (4 tools).
 *
 * Naming convention (NFR): snake_case derived from the client method:
 *   tags.list     -> tags_list
 *   tags.create   -> tags_create
 *   tags.assign   -> tags_assign
 *   tags.unassign -> tags_unassign
 *
 * tags.list takes an input (projectId). tags.create takes a name +
 * optional color. tags.assign/unassign take a taskId + tagId.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DevTrackerClient } from "@dev-tracker/client";
import {
  listTagsInputSchema,
  createTagInputSchema,
  assignTagInputSchema,
  unassignTagInputSchema,
} from "@dev-tracker/client";
import { wrapInputTool, shapeOf } from "./_helpers.js";
import { isToolRegisteredAndTrack } from "../register.js";

export const TAGS_TOOL_NAMES = [
  "tags_list",
  "tags_create",
  "tags_assign",
  "tags_unassign",
] as const;

export type TagsToolName = (typeof TAGS_TOOL_NAMES)[number];

export function registerTagsTools(
  server: McpServer,
  client: DevTrackerClient,
): void {
  const guard = isToolRegisteredAndTrack;

  if (guard("tags_list")) {
    server.registerTool(
      "tags_list",
      {
        description: "List all tags in a project.",
        inputSchema: listTagsInputSchema,
      },
      wrapInputTool(client.tags.list),
    );
  }
  if (guard("tags_create")) {
    server.tool(
      "tags_create",
      "Create a new tag in a project.",
      shapeOf(createTagInputSchema),
      wrapInputTool(client.tags.create),
    );
  }
  if (guard("tags_assign")) {
    server.tool(
      "tags_assign",
      "Attach a tag to a task.",
      shapeOf(assignTagInputSchema),
      wrapInputTool(client.tags.assign),
    );
  }
  if (guard("tags_unassign")) {
    server.tool(
      "tags_unassign",
      "Detach a tag from a task.",
      shapeOf(unassignTagInputSchema),
      wrapInputTool(client.tags.unassign),
    );
  }
}
