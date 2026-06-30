import { z } from "zod";

export const createTaskDtoSchema = z.object({
  columnId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  order: z.number().int().nonnegative(),
  assigneeId: z.string().optional(),
});

export type CreateTaskDto = z.infer<typeof createTaskDtoSchema>;
