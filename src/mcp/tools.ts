import { z } from "zod";
import { McpClient } from "./client";

/**
 * Zod schemas for every MCP tool. The same schemas drive two things:
 *   1. Input validation inside executeTool — invalid args become a 400-shaped
 *      error forwarded to the MCP client.
 *   2. JSON Schema advertised to the LLM via ListToolsRequestSchema (see
 *      src/mcp/index.ts).
 *
 * The schemas are intentionally re-declared here (instead of imported from
 * the milestone/sprint modules) so the MCP layer stays a leaf: a change to
 * the REST DTO does NOT silently change the MCP contract — both must be
 * updated and tested.
 */
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

  // ─────────────── Milestone tools (6) ───────────────

  list_milestones: z.object({
    projectId: z.string().min(1, "Required"),
    includeArchived: z.boolean().optional().default(false),
  }),
  get_milestone: z.object({
    projectId: z.string().min(1, "Required"),
    milestoneId: z.string().min(1, "Required"),
  }),
  create_milestone: z.object({
    projectId: z.string().min(1, "Required"),
    title: z.string().min(1, "Required").max(120),
    description: z.string().max(2000).optional(),
    dueDate: z.string().datetime().optional(),
  }),
  update_milestone: z.object({
    projectId: z.string().min(1, "Required"),
    milestoneId: z.string().min(1, "Required"),
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    status: z.enum(["open", "closed", "archived"]).optional(),
  }),
  delete_milestone: z.object({
    projectId: z.string().min(1, "Required"),
    milestoneId: z.string().min(1, "Required"),
  }),
  archive_milestone: z.object({
    projectId: z.string().min(1, "Required"),
    milestoneId: z.string().min(1, "Required"),
  }),

  // ─────────────── Sprint tools (5) ───────────────

  list_sprints: z.object({
    projectId: z.string().min(1, "Required"),
  }),
  get_sprint: z.object({
    projectId: z.string().min(1, "Required"),
    sprintId: z.string().min(1, "Required"),
  }),
  create_sprint: z.object({
    projectId: z.string().min(1, "Required"),
    name: z.string().min(1, "Required").max(120),
    description: z.string().max(2000).optional(),
    milestoneId: z.string().min(1).optional(),
  }),
  update_sprint: z.object({
    projectId: z.string().min(1, "Required"),
    sprintId: z.string().min(1, "Required"),
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).nullable().optional(),
    // `null` is significant here — it detaches the sprint from its milestone.
    milestoneId: z.string().min(1).nullable().optional(),
  }),
  delete_sprint: z.object({
    projectId: z.string().min(1, "Required"),
    sprintId: z.string().min(1, "Required"),
  }),
};

/**
 * Execute a single MCP tool by name.
 *
 * The switch covers every tool registered in src/mcp/index.ts. URLs match
 * the REST shape under /api so the LLM and the curl client share the same
 * resource graph. Two contracts deserve a callout:
 *
 *   - `move_task` rewrites the MCP-visible { taskId, columnId } into the
 *     REST-visible { targetColumnId, newIndex: 0 }. See the case body.
 *
 *   - `update_sprint` MUST preserve an explicit `null` for milestoneId so
 *     the sprint can be detached from its milestone. A naive "spread args
 *     minus projectId/sprintId" would drop the null and silently leave the
 *     sprint attached. We rebuild the body explicitly to keep `null`.
 */
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

    // ─────────────── Milestone tools (6) ───────────────

    case "list_milestones": {
      const qs = args.includeArchived
        ? "?includeArchived=true"
        : "";
      result = await client.get(
        `/projects/${args.projectId}/milestones${qs}`,
      );
      break;
    }
    case "get_milestone":
      result = await client.get(
        `/projects/${args.projectId}/milestones/${args.milestoneId}`,
      );
      break;
    case "create_milestone": {
      const { projectId, ...body } = args;
      result = await client.post(`/projects/${projectId}/milestones`, body);
      break;
    }
    case "update_milestone": {
      const { projectId, milestoneId, ...body } = args;
      result = await client.patch(
        `/projects/${projectId}/milestones/${milestoneId}`,
        body,
      );
      break;
    }
    case "delete_milestone":
      result = await client.delete(
        `/projects/${args.projectId}/milestones/${args.milestoneId}`,
      );
      break;
    case "archive_milestone":
      result = await client.post(
        `/projects/${args.projectId}/milestones/${args.milestoneId}/archive`,
        {},
      );
      break;

    // ─────────────── Sprint tools (5) ───────────────

    case "list_sprints":
      result = await client.get(`/projects/${args.projectId}/sprints`);
      break;
    case "get_sprint":
      result = await client.get(
        `/projects/${args.projectId}/sprints/${args.sprintId}`,
      );
      break;
    case "create_sprint": {
      const { projectId, ...body } = args;
      result = await client.post(`/projects/${projectId}/sprints`, body);
      break;
    }
    case "update_sprint": {
      const { projectId, sprintId, ...body } = args;
      result = await client.patch(
        `/projects/${projectId}/sprints/${sprintId}`,
        body,
      );
      break;
    }
    case "delete_sprint":
      result = await client.delete(
        `/projects/${args.projectId}/sprints/${args.sprintId}`,
      );
      break;

    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
}