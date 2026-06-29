import type { ProjectRepository } from "@projects/domain/repositories/project-repository.js";
import type { ProjectResponseDto } from "@projects/application/dto/project-response-dto.js";

export class GetProject {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(id: string, userId: string): Promise<ProjectResponseDto | null> {
    const project = await this.projectRepository.findById(id);
    if (!project) return null;

    const member = project.members.find((m) => m.userId === userId);
    if (!member) return null;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      archived: project.archived,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      role: member.role,
    };
  }
}
