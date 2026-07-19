import { z } from "zod";
import type { Milestone } from "@milestones/domain/entities/milestone.js";
import { MilestoneStatus } from "@milestones/domain/value-objects/milestone-status.js";

/**
 * Request DTO schemas — Zod-validated at the route boundary via
 * validateBody(). Any request body that fails parsing becomes a 400
 * before reaching the use case.
 *
 * Note: the spec called the field `title` but the Prisma column is
 * `name` (locked by PR A). The API contract exposes `title` because
 * that's the domain concept; the repo translates at persistence time.
 */
export const createMilestoneDtoSchema = z.object({
  title: z.string().min(1, "title is required").max(120),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z
    .string()
    .datetime({ message: "dueDate must be an ISO 8601 timestamp" })
    .nullable()
    .optional(),
});

export type CreateMilestoneDto = z.infer<typeof createMilestoneDtoSchema>;

export const updateMilestoneDtoSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z
    .string()
    .datetime({ message: "dueDate must be an ISO 8601 timestamp" })
    .nullable()
    .optional(),
  status: z.enum(["open", "closed", "archived"]).optional(),
});

export type UpdateMilestoneDto = z.infer<typeof updateMilestoneDtoSchema>;

/**
 * Response shape — the public contract for a Milestone.
 *
 * Field names match the domain concept (title, dueDate, status) NOT the
 * Prisma column names (name, targetDate). The controller maps from the
 * entity via `toResponseDto()`.
 */
export interface MilestoneResponseDto {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: "open" | "closed" | "archived";
  createdAt: string;
  updatedAt: string;
}

export function toResponseDto(milestone: Milestone): MilestoneResponseDto {
  return {
    id: milestone.id,
    projectId: milestone.projectId,
    title: milestone.title,
    description: milestone.description,
    dueDate: milestone.dueDate ? milestone.dueDate.toISOString() : null,
    status: new MilestoneStatus(milestone.status.value).value,
    createdAt: milestone.createdAt.toISOString(),
    updatedAt: milestone.updatedAt.toISOString(),
  };
}