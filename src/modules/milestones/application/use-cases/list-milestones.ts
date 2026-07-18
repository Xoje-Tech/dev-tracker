import type { PrismaClient } from "@prisma/client";
import type {
  MilestoneRepository,
  ListMilestonesFilter,
} from "@milestones/domain/repositories/milestone-repository.js";
import type { MilestoneMembershipGuard } from "@milestones/application/membership-guard.js";
import type {
  MilestoneResponseDto,
} from "@milestones/application/dto/milestone-dto.js";
import { toResponseDto } from "@milestones/application/dto/milestone-dto.js";
import { AppError } from "@shared/infrastructure/http/error-handler.js";

/**
 * ListMilestones — use case for GET /api/projects/:projectId/milestones.
 *
 * Flow:
 *   1. Verify the project exists (return 404 if not).
 *   2. Verify the actor is a ProjectMember (return 403 otherwise).
 *   3. Fetch the milestones for the project, applying the optional
 *      `includeArchived` flag (default false hides archived entries).
 *   4. Return the array of response DTOs in the contract order.
 *
 * Ordering is enforced inside the repository (targetDate ASC NULLS
 * LAST, then createdAt ASC). This use case does not sort — sorting
 * belongs at the persistence boundary.
 */
export class ListMilestones {
  constructor(
    private readonly milestoneRepository: MilestoneRepository,
    private readonly membershipGuard: MilestoneMembershipGuard,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    projectId: string,
    actorId: string,
    filter: ListMilestonesFilter = {},
  ): Promise<MilestoneResponseDto[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new AppError(404, "Project not found");
    }

    await this.membershipGuard.assertMember(projectId, actorId);

    const milestones = await this.milestoneRepository.findByProjectId(
      projectId,
      filter,
    );
    return milestones.map(toResponseDto);
  }
}