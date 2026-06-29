import type { Project } from "@projects/domain/entities/project.js";
import type { ProjectMember } from "@projects/domain/entities/project-member.js";

export interface ProjectRepository {
  findById(id: string): Promise<(Project & { members: ProjectMember[] }) | null>;
  findAllByOwner(userId: string): Promise<Project[]>;
  create(project: Project, ownerId: string): Promise<Project>;
  update(project: Project): Promise<Project>;
  archive(id: string): Promise<void>;
}
