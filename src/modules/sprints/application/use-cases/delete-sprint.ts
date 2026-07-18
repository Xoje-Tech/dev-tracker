import type { PrismaClient } from "@prisma/client";
import type { SprintRepository } from "@sprints/domain/persistence/sprint-repository.js";
import type { SprintMembershipGuard } from "@sprints/application/membership-guard.js";
import {
  SprintProjectNotFoundError,
  SprintNotFoundError,
} from "@sprints/domain/errors.js";

/**
 * DeleteSprint — use case for DELETE /api/projects/:projectId/sprints/:sprintId.
 *
 * Per spec (decision A from sdd-spec): Sprint delete preserves Tasks
 * with sprintId=null (FK SetNull on Task.sprintId). The cascade is
 * enforced by the schema, not by this code — we just call repo.delete.
 *
 * 403 when actor is not a ProjectMember. 404 when the project or
 * sprint does not exist (or the sprint belongs to a different project).
 */
export class DeleteSprint {
  constructor(
    private readonly sprintRepository: SprintRepository,
    private readonly membershipGuard: SprintMembershipGuard,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    projectId: string,
    sprintId: string,
    actorId: string,
  ): Promise<void> {
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

    await this.sprintRepository.delete(sprintId);
  }
}