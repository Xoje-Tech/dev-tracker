import { z } from "zod";

export const createTaskDtoSchema = z.object({
  columnId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  // Order is intentionally optional. CreateTask.execute() always computes
  // order as max(existing) + 1 within the target column, so the DTO does
  // not require the caller to provide it. Required for MCP clients (and
  // any other consumer) that should not need to reason about indices.
  order: z.number().int().nonnegative().optional(),
  assigneeId: z.string().optional(),
});

export type CreateTaskDto = z.infer<typeof createTaskDtoSchema>;
