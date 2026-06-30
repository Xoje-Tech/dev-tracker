/**
 * Zod schemas for the 5 project endpoints.
 *
 * Source of truth for the wire contract. Backend's matching DTOs in
 * `packages/backend/src/modules/projects/application/dto/` are kept
 * in sync manually.
 */
import { z } from "zod";

export const listProjectsInputSchema = z.object({}).strict();
export type ListProjectsInput = z.infer<typeof listProjectsInputSchema>;

export const getProjectInputSchema = z.object({
  id: z.string().min(1),
});
export type GetProjectInput = z.infer<typeof getProjectInputSchema>;

export const createProjectInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const updateProjectInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export const archiveProjectInputSchema = z.object({
  id: z.string().min(1),
});
export type ArchiveProjectInput = z.infer<typeof archiveProjectInputSchema>;

export const projectOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  archived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  role: z.string(),
});
export type ProjectOutput = z.infer<typeof projectOutputSchema>;

export const projectListOutputSchema = z.array(projectOutputSchema);
export type ProjectListOutput = z.infer<typeof projectListOutputSchema>;
