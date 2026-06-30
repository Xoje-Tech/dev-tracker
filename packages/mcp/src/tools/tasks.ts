/**
 * MCP tool registrations for the tasks domain (4 tools).
 *
 * Naming convention (NFR): snake_case derived from the client method:
 *   tasks.create -> tasks_create
 *   tasks.update -> tasks_update
 *   tasks.delete -> tasks_delete
 *   tasks.move   -> tasks_move
 *
 * All four take a typed input; none are no-input.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DevTrackerClient } from "@dev-tracker/client";
import {
  createTaskInputSchema,
  updateTaskInputSchema,
  deleteTaskInputSchema,
  moveTaskInputSchema,
} from "@dev-tracker/client";
import { wrapInputTool, shapeOf } from "./_helpers.js";
import { isToolRegisteredAndTrack } from "../register.js";

export const TASKS_TOOL_NAMES = [
  "tasks_create",
  "tasks_update",
  "tasks_delete",
  "tasks_move",
] as const;

export type TasksToolName = (typeof TASKS_TOOL_NAMES)[number];

export function registerTasksTools(
  server: McpServer,
  client: DevTrackerClient,
): void {
  const guard = isToolRegisteredAndTrack;

  if (guard("tasks_create")) {
    server.tool(
      "tasks_create",
      "Create a new task in a column.",
      shapeOf(createTaskInputSchema),
      wrapInputTool(client.tasks.create),
    );
  }
  if (guard("tasks_update")) {
    server.tool(
      "tasks_update",
      "Partial update of a task (title, description, priority, assignee).",
      shapeOf(updateTaskInputSchema),
      wrapInputTool(client.tasks.update),
    );
  }
  if (guard("tasks_delete")) {
    server.tool(
      "tasks_delete",
      "Delete a task permanently.",
      shapeOf(deleteTaskInputSchema),
      wrapInputTool(client.tasks.delete),
    );
  }
  if (guard("tasks_move")) {
    server.tool(
      "tasks_move",
      "Move a task to a different column (and/or reorder within a column).",
      shapeOf(moveTaskInputSchema),
      wrapInputTool(client.tasks.move),
    );
  }
}
