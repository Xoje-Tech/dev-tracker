/**
 * Zod schemas for the 4 tag endpoints.
 */
import { z } from "zod";

export const listTagsInputSchema = z.object({}).strict();
export type ListTagsInput = z.infer<typeof listTagsInputSchema>;

export const createTagInputSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#6366f1"),
});
export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const assignTagInputSchema = z.object({
  taskId: z.string().min(1),
  tagId: z.string().min(1),
});
export type AssignTagInput = z.infer<typeof assignTagInputSchema>;

export const unassignTagInputSchema = z.object({
  taskId: z.string().min(1),
  tagId: z.string().min(1),
});
export type UnassignTagInput = z.infer<typeof unassignTagInputSchema>;

export const tagOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});
export type TagOutput = z.infer<typeof tagOutputSchema>;

export const tagListOutputSchema = z.array(tagOutputSchema);
export type TagListOutput = z.infer<typeof tagListOutputSchema>;
