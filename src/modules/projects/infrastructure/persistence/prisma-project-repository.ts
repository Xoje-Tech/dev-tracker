import type { ProjectRepository } from "../../domain/repositories/project-repository.js";
import type { Project } from "../../domain/entities/project.js";
import type { ProjectMember } from "../../domain/entities/project-member.js";
import type { PrismaClient } from "@prisma/client";

export class PrismaProjectRepository implements ProjectRepository {
  constructor(_prisma: PrismaClient) {}

  async findById(_id: string): Promise<(Project & { members: ProjectMember[] }) | null> {
    throw new Error("Not implemented");
  }

  async findAllByOwner(_userId: string): Promise<Project[]> {
    throw new Error("Not implemented");
  }

  async create(): Promise<Project> {
    throw new Error("Not implemented");
  }

  async update(): Promise<Project> {
    throw new Error("Not implemented");
  }

  async archive(_id: string): Promise<void> {
    throw new Error("Not implemented");
  }
}
