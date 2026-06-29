import type { ProjectRepository } from "@projects/domain/repositories/project-repository.js";

export class ListProjects {
  constructor(_projectRepository: ProjectRepository) {}

  async execute(_userId: string): Promise<unknown[]> {
    throw new Error("Not implemented");
  }
}
