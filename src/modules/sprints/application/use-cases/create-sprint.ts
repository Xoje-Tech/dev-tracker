import type { PrismaClient } from "@prisma/client";
import type { SprintRepository } from "@sprints/domain/persistence/sprint-repository.js";
import type { SprintMembershipGuard } from "@sprints/application/membership-guard.js";
import type {
  CreateSprintDto,
  SprintResponseDto,
} from "@sprints/application/dto/sprint-dto.js";
import { toResponseDto } from "@sprints/application/dto/sprint-dto.js";
import { Sprint } from "@sprints/domain/sprint.js";
import { SprintName } from "@sprints/domain/value-objects/sprint-name.js";
import {
  SprintProjectNotFoundError,
  SprintCrossProjectMilestoneError,
  SprintMilestoneNotFoundError,
} from "@sprints/domain/errors.js";

/**
 * CreateSprint — use case for POST /api/projects/:projectId/sprints.
 *
 * Flow:
 *   1. Verify the project exists (404 if not — leak is acceptable for
 *      authenticated members; consistent with milestones).
 *   2. Verify the actor is a ProjectMember (403 otherwise). Order matters:
 *      we want non-members to see 403 on every project they don't belong
 *      to, never 404.
 *   3. If a milestoneId was provided, verify it exists and belongs to
 *      the SAME project. Cross-project linkage is a malformed request
 *      (400), not an auth failure (403).
 *   4. Build the entity, persist, return the response DTO.
 */
export class CreateSprint {
  constructor(
    private readonly sprintRepository: SprintRepository,
    private readonly membershipGuard: SprintMembershipGuard,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    projectId: string,
    actorId: string,
    dto: CreateSprintDto,
  ): Promise<SprintResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new SprintProjectNotFoundError(projectId);
    }

    await this.membershipGuard.assertMember(projectId, actorId);

    // Validate name through VO up-front so we never persist an invalid name.
    const name = new SprintName(dto.name);

    if (dto.milestoneId) {
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

    const now = new Date();
    const sprint = new Sprint({
      id: crypto.randomUUID(),
      projectId,
      milestoneId: dto.milestoneId ?? null,
      name,
      description: dto.description ?? null,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.sprintRepository.create(sprint);
    return toResponseDto(saved);
  }
}