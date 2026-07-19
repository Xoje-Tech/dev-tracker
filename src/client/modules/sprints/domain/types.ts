/**
 * Sprints module — domain types.
 * Mirrors the backend wire DTO at
 * src/modules/sprints/application/dto/sprint-dto.ts
 * (`SprintResponseDto`).
 *
 * Field names use the domain concept (`name`, `milestoneId`) NOT
 * raw column names. Sprints have no `status` field — only name +
 * description + optional milestone link.
 */

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  milestoneId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSprintInput {
  name: string;
  description?: string | null;
  milestoneId?: string | null;
}

export interface UpdateSprintInput {
  name?: string;
  description?: string | null;
  milestoneId?: string | null;
}