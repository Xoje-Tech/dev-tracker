import { z } from "zod";

export const updateTaskDtoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export type UpdateTaskDto = z.infer<typeof updateTaskDtoSchema>;
