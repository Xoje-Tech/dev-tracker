import type { PrismaClient } from "@prisma/client";
import type { SprintRepository } from "@sprints/domain/persistence/sprint-repository.js";
import type { SprintMembershipGuard } from "@sprints/application/membership-guard.js";
import type {
  SprintResponseDto,
} from "@sprints/application/dto/sprint-dto.js";
import { toResponseDto } from "@sprints/application/dto/sprint-dto.js";
import {
  SprintNotFoundError,
  SprintProjectNotFoundError,
} from "@sprints/domain/errors.js";

/**
 * GetSprint — use case for GET /api/projects/:projectId/sprints/:sprintId.
 *
 * Flow (parent-nested authz PRECEDES repo lookup):
 *   1. Verify the project exists (404 if not).
 *   2. Verify the actor is a ProjectMember (403 otherwise — applied before
 *      the sprint lookup so outsiders never learn whether the id exists).
 *   3. Load the sprint scoped to the project (404 if absent or in a
 *      different project).
 *   4. Return the response DTO.
 */
export class GetSprint {
  constructor(
    private readonly sprintRepository: SprintRepository,
    private readonly membershipGuard: SprintMembershipGuard,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    projectId: string,
    sprintId: string,
    actorId: string,
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

    return toResponseDto(existing);
  }
}