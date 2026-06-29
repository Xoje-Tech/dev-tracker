import type { ProjectRepository } from "../../domain/repositories/project-repository.js";

export class ArchiveProject {
  constructor(_projectRepository: ProjectRepository) {}

  async execute(_id: string): Promise<void> {
    throw new Error("Not implemented");
  }
}
