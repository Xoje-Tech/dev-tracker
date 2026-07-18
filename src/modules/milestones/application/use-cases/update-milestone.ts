import type { PrismaClient } from "@prisma/client";
import type { MilestoneRepository } from "@milestones/domain/repositories/milestone-repository.js";
import type { MilestoneMembershipGuard } from "@milestones/application/membership-guard.js";
import type {
  UpdateMilestoneDto,
  MilestoneResponseDto,
} from "@milestones/application/dto/milestone-dto.js";
import { toResponseDto } from "@milestones/application/dto/milestone-dto.js";
import { MilestoneTitle } from "@milestones/domain/value-objects/milestone-title.js";
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
 * UpdateMilestone — use case for PATCH /api/projects/:projectId/milestones/:milestoneId.
 *
 * Flow:
 *   1. Verify the project exists (404 if not).
 *   2. Verify the actor is a ProjectMember (403 otherwise — applied before
 *      the milestone lookup so outsiders never learn whether the id exists).
 *   3. Load the milestone scoped to the project (404 if absent).
 *   4. If a status is requested, assert the transition is legal via
 *      MilestoneStatusTransitions. Illegal transitions throw 409.
 *   5. Apply the patches. Empty body is a no-op (re-saves the existing row
 *      untouched so the response stays consistent with the no-op semantics).
 *   6. Persist via MilestoneRepository.update and return the response DTO.
 *
 * Field naming: the DTO uses `title` / `dueDate` (the domain vocabulary);
 * the Prisma column is `name` / `targetDate`. Translation happens inside
 * the repository's update() method — the use case never touches raw column
 * names. The mapping was locked in PR A and is preserved here.
 */
export class UpdateMilestone {
  constructor(
    private readonly milestoneRepository: MilestoneRepository,
    private readonly membershipGuard: MilestoneMembershipGuard,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    projectId: string,
    milestoneId: string,
    actorId: string,
    dto: UpdateMilestoneDto,
  ): Promise<MilestoneResponseDto> {
    // 1. Project existence check.
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new MilestoneProjectNotFoundError(projectId);
    }

    // 2. Membership guard (403 for outsiders).
    await this.membershipGuard.assertMember(projectId, actorId);

    // 3. Milestone lookup scoped to the project. A milestone that exists
    //    but belongs to a different project surfaces as 404 — the actor is
    //    a member of THIS project, not the milestone's project, and
    //    exposing cross-project state would break isolation.
    const existing = await this.milestoneRepository.findById(milestoneId);
    if (!existing || existing.projectId !== projectId) {
      throw new MilestoneNotFoundError(milestoneId);
    }

    // 4. Validate title via the VO. The VO throws AppError(400) on its
    //    own; we just construct it to validate.
    if (dto.title !== undefined) {
      new MilestoneTitle(dto.title);
    }

    // 5. Validate the requested status transition.
    const nextStatus =
      dto.status !== undefined
        ? new MilestoneStatus(dto.status)
        : existing.status;
    if (dto.status !== undefined) {
      try {
        MilestoneStatusTransitions.assertCanTransition(
          existing.status,
          nextStatus,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Illegal status transition";
        throw new MilestoneInvalidStatusTransitionError(message);
      }
    }

    // 6. Build the patched entity. Title is re-derived through the VO so
    //    trimming/normalisation rules match the create path. Description
    //    is a passthrough (nulls allowed). dueDate is ISO-parsed when
    //    present; an explicit null clears the field.
    const titleValue =
      dto.title !== undefined
        ? new MilestoneTitle(dto.title).value
        : existing.title;
    const descriptionValue =
      dto.description !== undefined ? dto.description : existing.description;
    const dueDateValue =
      dto.dueDate !== undefined
        ? dto.dueDate
          ? new Date(dto.dueDate)
          : null
        : existing.dueDate;

    const updated = new Milestone({
      id: existing.id,
      projectId: existing.projectId,
      title: titleValue,
      description: descriptionValue,
      dueDate: dueDateValue,
      status: nextStatus,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.milestoneRepository.update(updated);
    return toResponseDto(saved);
  }
}
