import type { ProjectRepository } from "@projects/domain/repositories/project-repository.js";

export class GetProject {
  constructor(_projectRepository: ProjectRepository) {}

  async execute(_id: string): Promise<unknown | null> {
    throw new Error("Not implemented");
  }
}
