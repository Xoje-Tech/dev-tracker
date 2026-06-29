import type { ProjectRepository } from "@projects/domain/repositories/project-repository.js";
import type { UpdateProjectDto } from "@projects/application/dto/update-project-dto.js";
import { Project } from "@projects/domain/entities/project.js";
import { ProjectName } from "@projects/domain/value-objects/project-name.js";
import type { ProjectResponseDto } from "@projects/application/dto/project-response-dto.js";

export class UpdateProject {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(id: string, data: UpdateProjectDto): Promise<ProjectResponseDto> {
    const existing = await this.projectRepository.findById(id);
    if (!existing) {
      throw new Error("Project not found");
    }

    const name = data.name !== undefined ? new ProjectName(data.name) : undefined;

    const updated = new Project({
      id: existing.id,
      name: name?.value ?? existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      archived: existing.archived,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.projectRepository.update(updated);

    const member = existing.members.find((m) => m.userId === existing.id);
    return {
      id: saved.id,
      name: saved.name,
      description: saved.description,
      archived: saved.archived,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
      role: member?.role ?? "member",
    };
  }
}
