import type { ProjectRepository } from "../../domain/repositories/project-repository.js";

export class GetProject {
  constructor(_projectRepository: ProjectRepository) {}

  async execute(_id: string): Promise<unknown | null> {
    throw new Error("Not implemented");
  }
}
