import { z } from "zod";
import { McpClient } from "./client";

export const schemas = {
  list_projects: z.object({}),
  get_project_board: z.object({
    projectId: z.string().min(1, "Required"),
  }),
  create_project: z.object({
    name: z.string().min(1, "Required"),
  }),
  create_task: z.object({
    projectId: z.string().min(1, "Required"),
    title: z.string().min(1, "Required"),
    description: z.string(),
    columnId: z.string().min(1, "Required"),
  }),
  move_task: z.object({
    taskId: z.string().min(1, "Required"),
    columnId: z.string().min(1, "Required"),
  }),
  update_task: z.object({
    taskId: z.string().min(1, "Required"),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    assigneeId: z.string().nullable().optional(),
  }),
  delete_task: z.object({
    taskId: z.string().min(1, "Required"),
  }),
};

export async function executeTool(client: McpClient, name: string, args: any) {
  let result;
  switch (name) {
    case "list_projects":
      result = await client.get("/projects");
      break;
    case "get_project_board":
      result = await client.get(`/projects/${args.projectId}/board`);
      break;
    case "create_project":
      result = await client.post("/projects", args);
      break;
    case "create_task":
      result = await client.post("/tasks", args);
      break;
    case "move_task":
      // Backend expects { targetColumnId, newIndex }; MCP exposes only
      // { taskId, columnId } so the LLM never has to think about indices.
      // We translate columnId → targetColumnId and default newIndex to 0
      // (append to end of target column).
      result = await client.post(`/tasks/${args.taskId}/move`, {
        targetColumnId: args.columnId,
        newIndex: 0,
      });
      break;
    case "update_task": {
      const { taskId, ...body } = args;
      result = await client.patch(`/tasks/${taskId}`, body);
      break;
    }
    case "delete_task":
      result = await client.delete(`/tasks/${args.taskId}`);
      break;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
}
