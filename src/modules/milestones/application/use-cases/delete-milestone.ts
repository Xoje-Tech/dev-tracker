import type { PrismaClient } from "@prisma/client";
import type { MilestoneRepository } from "@milestones/domain/repositories/milestone-repository.js";
import type { MilestoneMembershipGuard } from "@milestones/application/membership-guard.js";
import {
  MilestoneNotFoundError,
  MilestoneProjectNotFoundError,
} from "@milestones/domain/errors.js";

/**
 * DeleteMilestone — use case for DELETE /api/projects/:projectId/milestones/:milestoneId.
 *
 * Hard delete. Any Sprint that referenced this milestone now has
 * milestoneId = null (the Prisma schema declares `onDelete: SetNull` on
 * Sprint.milestoneId — see schema.prisma; PR A pinned this contract).
 *
 * Flow:
 *   1. Verify the project exists (404 if not).
 *   2. Verify the actor is a ProjectMember (403 otherwise).
 *   3. Load the milestone (404 if absent OR not in the project — both
 *      surface as 404 to avoid leaking cross-project ids).
 *   4. Delete via the repository. The Prisma cascade nulls out
 *      Sprint.milestoneId automatically.
 */
export class DeleteMilestone {
  constructor(
    private readonly milestoneRepository: MilestoneRepository,
    private readonly membershipGuard: MilestoneMembershipGuard,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    projectId: string,
    milestoneId: string,
    actorId: string,
  ): Promise<void> {
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

    await this.milestoneRepository.delete(milestoneId);
  }
}
