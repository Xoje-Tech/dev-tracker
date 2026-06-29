import type { ProjectRepository } from "@projects/domain/repositories/project-repository.js";
import type { ProjectResponseDto } from "@projects/application/dto/project-response-dto.js";

export class ListProjects {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(userId: string): Promise<ProjectResponseDto[]> {
    const projects = await this.projectRepository.findByUserId(userId);
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      archived: p.archived,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      role: p.role,
    }));
  }
}
