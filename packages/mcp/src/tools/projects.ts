/**
 * MCP tool registrations for the projects domain (5 tools).
 *
 * Naming convention (NFR): snake_case derived from the client method:
 *   projects.list     -> projects_list
 *   projects.get      -> projects_get
 *   projects.create   -> projects_create
 *   projects.update   -> projects_update
 *   projects.archive  -> projects_archive
 *
 * The orchestrator calls this function after auth and before boards/
 * tasks/tags so the registration order is deterministic (NFR-3).
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DevTrackerClient } from "@dev-tracker/client";
import {
  listProjectsInputSchema,
  getProjectInputSchema,
  createProjectInputSchema,
  updateProjectInputSchema,
  archiveProjectInputSchema,
} from "@dev-tracker/client";
import { wrapInputTool, shapeOf } from "./_helpers.js";
import { isToolRegisteredAndTrack } from "../register.js";

export const PROJECTS_TOOL_NAMES = [
  "projects_list",
  "projects_get",
  "projects_create",
  "projects_update",
  "projects_archive",
] as const;

export type ProjectsToolName = (typeof PROJECTS_TOOL_NAMES)[number];

export function registerProjectsTools(
  server: McpServer,
  client: DevTrackerClient,
): void {
  const guard = isToolRegisteredAndTrack;

  if (guard("projects_list")) {
    server.registerTool(
      "projects_list",
      {
        description: "List the caller's projects.",
        inputSchema: listProjectsInputSchema,
      },
      wrapInputTool(client.projects.list),
    );
  }
  if (guard("projects_get")) {
    server.tool(
      "projects_get",
      "Fetch one project by id.",
      shapeOf(getProjectInputSchema),
      wrapInputTool(client.projects.get),
    );
  }
  if (guard("projects_create")) {
    server.tool(
      "projects_create",
      "Create a project (and a default board).",
      shapeOf(createProjectInputSchema),
      wrapInputTool(client.projects.create),
    );
  }
  if (guard("projects_update")) {
    server.tool(
      "projects_update",
      "Partial update of a project.",
      shapeOf(updateProjectInputSchema),
      wrapInputTool(client.projects.update),
    );
  }
  if (guard("projects_archive")) {
    server.tool(
      "projects_archive",
      "Soft-archive a project.",
      shapeOf(archiveProjectInputSchema),
      wrapInputTool(client.projects.archive),
    );
  }
}