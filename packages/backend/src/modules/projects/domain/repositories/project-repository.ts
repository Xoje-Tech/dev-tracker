import type { Project } from "@projects/domain/entities/project.js";
import type { ProjectMember } from "@projects/domain/entities/project-member.js";

export interface ProjectRepository {
  findById(id: string): Promise<(Project & { members: ProjectMember[] }) | null>;
  findByUserId(userId: string): Promise<(Project & { role: string })[]>;
  create(project: Project, ownerId: string): Promise<Project>;
  update(project: Project): Promise<Project>;
  archive(id: string): Promise<void>;
  isMember(projectId: string, userId: string): Promise<boolean>;
}
