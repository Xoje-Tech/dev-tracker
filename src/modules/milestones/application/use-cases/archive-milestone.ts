import type { PrismaClient } from "@prisma/client";
import type { MilestoneRepository } from "@milestones/domain/repositories/milestone-repository.js";
import type { MilestoneMembershipGuard } from "@milestones/application/membership-guard.js";
import type { MilestoneResponseDto } from "@milestones/application/dto/milestone-dto.js";
import { toResponseDto } from "@milestones/application/dto/milestone-dto.js";
import {
  MilestoneStatus,
  MilestoneStatusTransitions,
} from "@milestones/domain/value-objects/milestone-status.js";
import { Milestone } from "@milestones/domain/entities/milestone.js";
import {
  MilestoneNotFoundError,
  MilestoneProjectNotFoundError,
  MilestoneInvalidStatusTransitionError,
} from "@milestones/domain/errors.js";

/**
 * ArchiveMilestone — use case for
 * POST /api/projects/:projectId/milestones/:milestoneId/archive.
 *
 * Soft delete. Sets the milestone's status to "archived" (no new column —
 * the Prisma schema from PR A has no archivedAt). The same->same transition
 * is a no-op: archiving an already-archived milestone returns 200 with the
 * existing row unchanged (idempotent).
 *
 * Flow:
 *   1. Verify the project exists (404 if not).
 *   2. Verify the actor is a ProjectMember (403 otherwise).
 *   3. Load the milestone scoped to the project (404 if absent).
 *   4. Build an "archived" target status and assert the transition is
 *      legal. The transitions table allows open->archived and
 *      closed->archived; the only illegal source is "archived" itself,
 *      which the same->same rule short-circuits to a no-op.
 *   5. Persist and return the response DTO.
 */
export class ArchiveMilestone {
  constructor(
    private readonly milestoneRepository: MilestoneRepository,
    private readonly membershipGuard: MilestoneMembershipGuard,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    projectId: string,
    milestoneId: string,
    actorId: string,
  ): Promise<MilestoneResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new MilestoneProjectNotFoundError(projectId);
    }

    await this.membershipGuard.assertMember(projectId, actorId);

    const existing = await this.milestoneRepository.findById(milestoneId);
    if (!existing || existing.projectId !== projectId) {
      throw new MilestoneNotFoundError(milestoneId);
    }

    const archived = new MilestoneStatus("archived");
    try {
      MilestoneStatusTransitions.assertCanTransition(existing.status, archived);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Illegal status transition";
      throw new MilestoneInvalidStatusTransitionError(message);
    }

    // Same->same is a no-op at the transitions level; still persist and
    // return the DTO so the body matches the user's expectations.
    const updated = new Milestone({
      id: existing.id,
      projectId: existing.projectId,
      title: existing.title,
      description: existing.description,
      dueDate: existing.dueDate,
      status: archived,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.milestoneRepository.update(updated);
    return toResponseDto(saved);
  }
}
