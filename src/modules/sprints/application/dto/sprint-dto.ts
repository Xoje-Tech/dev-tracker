import { z } from "zod";
import type { Sprint } from "@sprints/domain/sprint.js";

/**
 * Request DTO schemas — Zod-validated at the route boundary via
 * validateBody(). Any request body that fails parsing becomes a 400
 * before reaching the use case.
 */
export const createSprintDtoSchema = z.object({
  name: z.string().min(1, "name is required").max(120),
  description: z.string().max(2000).nullable().optional(),
  milestoneId: z.string().min(1).nullable().optional(),
});

export type CreateSprintDto = z.infer<typeof createSprintDtoSchema>;

export const updateSprintDtoSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  milestoneId: z.string().min(1).nullable().optional(),
});

export type UpdateSprintDto = z.infer<typeof updateSprintDtoSchema>;

/**
 * Response shape — the public contract for a Sprint.
 * Per spec: no status, no dates, only the link to its parent project
 * and the optional link to a milestone.
 */
export interface SprintResponseDto {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  milestoneId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toResponseDto(sprint: Sprint): SprintResponseDto {
  return {
    id: sprint.id,
    projectId: sprint.projectId,
    name: sprint.name.value,
    description: sprint.description,
    milestoneId: sprint.milestoneId,
    createdAt: sprint.createdAt.toISOString(),
    updatedAt: sprint.updatedAt.toISOString(),
  };
}