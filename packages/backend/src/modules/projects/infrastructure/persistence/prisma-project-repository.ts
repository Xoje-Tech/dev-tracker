import type { PrismaClient } from "@prisma/client";
import { Project as PrismaProject, ProjectMember as PrismaProjectMember } from "@prisma/client";
import type { ProjectRepository } from "@projects/domain/repositories/project-repository.js";
import { Project } from "@projects/domain/entities/project.js";
import { ProjectMember } from "@projects/domain/entities/project-member.js";

function toDomainProject(p: PrismaProject): Project {
  return new Project({
    id: p.id,
    name: p.name,
    description: p.description,
    archived: p.archived,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  });
}

function toDomainMember(m: PrismaProjectMember): ProjectMember {
  return new ProjectMember({
    id: m.id,
    projectId: m.projectId,
    userId: m.userId,
    role: m.role,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  });
}

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<(Project & { members: ProjectMember[] }) | null> {
    const found = await this.prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });
    if (!found) return null;
    return {
      ...toDomainProject(found),
      members: found.members.map(toDomainMember),
    };
  }

  async findByUserId(userId: string): Promise<(Project & { role: string })[]> {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      include: { project: true },
    });
    return memberships
      .filter((m) => !m.project.archived)
      .map((m) => ({
        ...toDomainProject(m.project),
        role: m.role,
      }));
  }

  async create(project: Project, ownerId: string): Promise<Project> {
    const created = await this.prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          id: project.id,
          name: project.name,
          description: project.description,
          archived: project.archived,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      });
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: ownerId,
          role: "owner",
        },
      });
      return proj;
    });
    return toDomainProject(created);
  }

  async update(project: Project): Promise<Project> {
    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        name: project.name,
        description: project.description,
      },
    });
    return toDomainProject(updated);
  }

  async archive(id: string): Promise<void> {
    await this.prisma.project.update({
      where: { id },
      data: { archived: true },
    });
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    return member !== null;
  }
}
