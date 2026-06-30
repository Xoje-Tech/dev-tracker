import type { ProjectRepository } from "@projects/domain/repositories/project-repository.js";

export class ArchiveProject {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.projectRepository.findById(id);
    if (!existing) {
      throw new Error("Project not found");
    }
    await this.projectRepository.archive(id);
  }
}
