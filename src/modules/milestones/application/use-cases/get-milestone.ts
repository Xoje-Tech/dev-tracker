import type { PrismaClient } from "@prisma/client";
import type { MilestoneRepository } from "@milestones/domain/repositories/milestone-repository.js";
import type { MilestoneMembershipGuard } from "@milestones/application/membership-guard.js";
import type {
  MilestoneResponseDto,
} from "@milestones/application/dto/milestone-dto.js";
import { toResponseDto } from "@milestones/application/dto/milestone-dto.js";
import {
  MilestoneNotFoundError,
  MilestoneProjectNotFoundError,
} from "@milestones/domain/errors.js";

/**
 * GetMilestone — use case for GET /api/projects/:projectId/milestones/:milestoneId.
 *
 * Flow (parent-nested authz PRECEDES repo lookup):
 *   1. Verify the project exists (404 if not).
 *   2. Verify the actor is a ProjectMember (403 otherwise — applied before
 *      the milestone lookup so outsiders never learn whether the id exists).
 *   3. Load the milestone scoped to the project (404 if absent or in a
 *      different project).
 *   4. Return the response DTO.
 *
 * Why the membership check runs before the milestone lookup: this prevents
 * a probing outsider from using 404 vs 403 to enumerate which milestone ids
 * exist in the project.
 */
export class GetMilestone {
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

    return toResponseDto(existing);
  }
}