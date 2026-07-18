import type { PrismaClient } from "@prisma/client";
import type { MilestoneRepository } from "@milestones/domain/repositories/milestone-repository.js";
import type { MilestoneMembershipGuard } from "@milestones/application/membership-guard.js";
import type {
  CreateMilestoneDto,
  MilestoneResponseDto,
} from "@milestones/application/dto/milestone-dto.js";
import { toResponseDto } from "@milestones/application/dto/milestone-dto.js";
import { Milestone } from "@milestones/domain/entities/milestone.js";
import { MilestoneTitle } from "@milestones/domain/value-objects/milestone-title.js";
import { MilestoneStatus } from "@milestones/domain/value-objects/milestone-status.js";
import { AppError } from "@shared/infrastructure/http/error-handler.js";

/**
 * CreateMilestone — use case for POST /api/projects/:projectId/milestones.
 *
 * Flow:
 *   1. Verify the project exists (return 404 if not — leaks existence to
 *      authenticated members but is consistent with the spec's
 *      "404 if project does not exist" requirement).
 *   2. Verify the actor is a ProjectMember (return 403 otherwise).
 *   3. Validate title via MilestoneTitle VO (throws → 400 via error handler).
 *   4. Build the entity, persist it, return the response DTO.
 *
 * The 403/404 ordering matters: returning 404 before 403 would let
 * non-members probe whether projects exist. Returning 403 only when the
 * project DOES exist keeps the boundary tight — outsiders never see a
 * 404, only 403.
 */
export class CreateMilestone {
  constructor(
    private readonly milestoneRepository: MilestoneRepository,
    private readonly membershipGuard: MilestoneMembershipGuard,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    projectId: string,
    actorId: string,
    dto: CreateMilestoneDto,
  ): Promise<MilestoneResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new AppError(404, "Project not found");
    }

    await this.membershipGuard.assertMember(projectId, actorId);

    const title = new MilestoneTitle(dto.title);

    const now = new Date();
    const milestone = new Milestone({
      id: crypto.randomUUID(),
      projectId,
      title: title.value,
      description: dto.description ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      status: new MilestoneStatus("open"),
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.milestoneRepository.create(milestone);
    return toResponseDto(saved);
  }
}