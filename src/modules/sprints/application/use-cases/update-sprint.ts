import type { PrismaClient } from "@prisma/client";
import type { SprintRepository } from "@sprints/domain/persistence/sprint-repository.js";
import type { SprintMembershipGuard } from "@sprints/application/membership-guard.js";
import type {
  UpdateSprintDto,
  SprintResponseDto,
} from "@sprints/application/dto/sprint-dto.js";
import { toResponseDto } from "@sprints/application/dto/sprint-dto.js";
import { Sprint } from "@sprints/domain/sprint.js";
import { SprintName } from "@sprints/domain/value-objects/sprint-name.js";
import {
  SprintProjectNotFoundError,
  SprintNotFoundError,
  SprintCrossProjectMilestoneError,
  SprintMilestoneNotFoundError,
} from "@sprints/domain/errors.js";

/**
 * UpdateSprint — use case for PATCH /api/projects/:projectId/sprints/:sprintId.
 *
 * Behaviour per spec:
 * - 400 on invalid body (Zod).
 * - 403 when actor is not a ProjectMember.
 * - 404 when the project or sprint does not exist.
 * - 400 when the new milestoneId belongs to a different project.
 * - 200 with the updated entity body on success.
 * - 200 no-op when the body matches the current state.
 */
export class UpdateSprint {
  constructor(
    private readonly sprintRepository: SprintRepository,
    private readonly membershipGuard: SprintMembershipGuard,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    projectId: string,
    sprintId: string,
    actorId: string,
    dto: UpdateSprintDto,
  ): Promise<SprintResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new SprintProjectNotFoundError(projectId);
    }

    await this.membershipGuard.assertMember(projectId, actorId);

    const existing = await this.sprintRepository.findById(sprintId);
    if (!existing || existing.projectId !== projectId) {
      throw new SprintNotFoundError(sprintId);
    }

    // If the milestoneId is being changed (including to null), validate.
    if (
      dto.milestoneId !== undefined &&
      dto.milestoneId !== existing.milestoneId
    ) {
      if (dto.milestoneId !== null) {
        const milestone = await this.prisma.milestone.findUnique({
          where: { id: dto.milestoneId },
          select: { id: true, projectId: true },
        });
        if (!milestone) {
          throw new SprintMilestoneNotFoundError(dto.milestoneId);
        }
        if (milestone.projectId !== projectId) {
          throw new SprintCrossProjectMilestoneError(dto.milestoneId);
        }
      }
    }

    const updated = new Sprint({
      id: existing.id,
      projectId: existing.projectId,
      milestoneId:
        dto.milestoneId !== undefined ? dto.milestoneId : existing.milestoneId,
      name: dto.name !== undefined ? new SprintName(dto.name) : existing.name,
      description:
        dto.description !== undefined ? dto.description : existing.description,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.sprintRepository.update(updated);
    return toResponseDto(saved);
  }
}