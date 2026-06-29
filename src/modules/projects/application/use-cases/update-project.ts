import type { ProjectRepository } from "../../domain/repositories/project-repository.js";

export class UpdateProject {
  constructor(_projectRepository: ProjectRepository) {}

  async execute(_id: string, _data: Record<string, unknown>): Promise<unknown> {
    throw new Error("Not implemented");
  }
}
