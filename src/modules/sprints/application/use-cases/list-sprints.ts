import type { PrismaClient } from "@prisma/client";
import type { SprintRepository } from "@sprints/domain/persistence/sprint-repository.js";
import type { SprintMembershipGuard } from "@sprints/application/membership-guard.js";
import type { SprintResponseDto } from "@sprints/application/dto/sprint-dto.js";
import { toResponseDto } from "@sprints/application/dto/sprint-dto.js";
import { SprintProjectNotFoundError } from "@sprints/domain/errors.js";

/**
 * ListSprints — use case for GET /api/projects/:projectId/sprints.
 *
 * Returns the project's sprints ordered by createdAt asc (the oldest
 * sprint is the planning baseline). Membership and existence checks
 * mirror CreateSprint.
 */
export class ListSprints {
  constructor(
    private readonly sprintRepository: SprintRepository,
    private readonly membershipGuard: SprintMembershipGuard,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    projectId: string,
    actorId: string,
  ): Promise<SprintResponseDto[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new SprintProjectNotFoundError(projectId);
    }

    await this.membershipGuard.assertMember(projectId, actorId);

    const sprints = await this.sprintRepository.findByProjectId(projectId);
    return sprints.map(toResponseDto);
  }
}