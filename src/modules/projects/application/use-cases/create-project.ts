import type { ProjectRepository } from "@projects/domain/repositories/project-repository.js";
import type { CreateProjectDto } from "@projects/application/dto/create-project-dto.js";

export class CreateProject {
  constructor(_projectRepository: ProjectRepository) {}

  async execute(_dto: CreateProjectDto, _ownerId: string): Promise<{ id: string }> {
    throw new Error("Not implemented");
  }
}
