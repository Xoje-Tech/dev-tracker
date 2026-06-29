import type { ProjectRepository } from "../../domain/repositories/project-repository.js";

export class ListProjects {
  constructor(_projectRepository: ProjectRepository) {}

  async execute(_userId: string): Promise<unknown[]> {
    throw new Error("Not implemented");
  }
}
