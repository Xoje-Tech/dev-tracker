/**
 * Zod schemas for the 4 task endpoints.
 */
import { z } from "zod";

export const createTaskInputSchema = z.object({
  columnId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  order: z.number().int().nonnegative(),
  assigneeId: z.string().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assigneeId: z.string().nullable().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

export const deleteTaskInputSchema = z.object({
  id: z.string().min(1),
});
export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

export const moveTaskInputSchema = z.object({
  id: z.string().min(1),
  targetColumnId: z.string().min(1),
  newIndex: z.number().int().nonnegative(),
});
export type MoveTaskInput = z.infer<typeof moveTaskInputSchema>;

export const taskOutputSchema = z.object({
  id: z.string(),
  columnId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  priority: z.string(),
  order: z.number().int().nonnegative(),
  assigneeId: z.string().nullable(),
  creatorId: z.string(),
  tagIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TaskOutput = z.infer<typeof taskOutputSchema>;
