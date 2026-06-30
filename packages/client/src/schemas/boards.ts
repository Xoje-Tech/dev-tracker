/**
 * Zod schemas for the 2 board endpoints.
 *
 * Both take `{ projectId }`. The response shape mirrors the backend's
 * `BoardResponseDto` (TS interface) with nested columns + tasks.
 */
import { z } from "zod";

export const boardTaskOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  priority: z.string(),
  order: z.number().int().nonnegative(),
  assigneeId: z.string().nullable(),
  tagIds: z.array(z.string()),
  createdAt: z.string(),
});
export type BoardTaskOutput = z.infer<typeof boardTaskOutputSchema>;

export const boardColumnOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number().int().nonnegative(),
  tasks: z.array(boardTaskOutputSchema),
});
export type BoardColumnOutput = z.infer<typeof boardColumnOutputSchema>;

export const boardOutputSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  columns: z.array(boardColumnOutputSchema),
});
export type BoardOutput = z.infer<typeof boardOutputSchema>;

export const getBoardInputSchema = z.object({
  projectId: z.string().min(1),
});
export type GetBoardInput = z.infer<typeof getBoardInputSchema>;

export const createDefaultBoardInputSchema = z.object({
  projectId: z.string().min(1),
});
export type CreateDefaultBoardInput = z.infer<typeof createDefaultBoardInputSchema>;
