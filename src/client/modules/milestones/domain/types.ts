/**
 * Milestones module — domain types.
 * Mirrors the backend wire DTO at
 * src/modules/milestones/application/dto/milestone-dto.ts
 * (`MilestoneResponseDto`).
 *
 * Field names use the domain concept (`title`, `dueDate`) NOT the Prisma
 * column names (`name`, `targetDate`). The DTO is the only shape the
 * frontend should know about.
 */

export type MilestoneStatus = "open" | "closed" | "archived";

export const MILESTONE_STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: MilestoneStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  status?: MilestoneStatus;
}
