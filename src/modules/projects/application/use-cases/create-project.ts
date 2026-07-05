import type { ProjectRepository } from "@projects/domain/repositories/project-repository.js";
import type { BoardRepository } from "@boards/domain/repositories/board-repository.js";
import type { CreateProjectDto } from "@projects/application/dto/create-project-dto.js";
import { Project } from "@projects/domain/entities/project.js";
import { ProjectName } from "@projects/domain/value-objects/project-name.js";
import type { ProjectResponseDto } from "@projects/application/dto/project-response-dto.js";

export class CreateProject {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly boardRepository: BoardRepository,
  ) {}

  async execute(dto: CreateProjectDto, ownerId: string): Promise<ProjectResponseDto> {
    const name = new ProjectName(dto.name);
    const now = new Date();
    const id = crypto.randomUUID();

    const project = new Project({
      id,
      name: name.value,
      description: dto.description ?? null,
      repoUrl: dto.repoUrl ?? null,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.projectRepository.create(project, ownerId);
    await this.boardRepository.createWithDefaultColumns(saved.id);

    return {
      id: saved.id,
      name: saved.name,
      description: saved.description,
      repoUrl: saved.repoUrl,
      archived: saved.archived,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
      role: "owner",
    };
  }
}
