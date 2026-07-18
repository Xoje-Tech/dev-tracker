import type { PrismaClient } from "@prisma/client";
import type { SprintRepository } from "@sprints/domain/persistence/sprint-repository.js";
import { Sprint } from "@sprints/domain/sprint.js";
import { SprintName } from "@sprints/domain/value-objects/sprint-name.js";

/**
 * PrismaSprintRepository — implements SprintRepository against the real
 * Prisma client. No mocks; integration tests exercise this code path
 * directly via the sprints test app.
 *
 * Mapping: the entity uses SprintName (value object); the schema column
 * is the trimmed string. toDomain() / fromEntity() centralise the
 * translation so callers do not have to know about the VO.
 */
export class PrismaSprintRepository implements SprintRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(sprint: Sprint): Promise<Sprint> {
    const created = await this.prisma.sprint.create({
      data: {
        id: sprint.id,
        projectId: sprint.projectId,
        milestoneId: sprint.milestoneId,
        name: sprint.name.value,
        description: sprint.description,
        createdAt: sprint.createdAt,
        updatedAt: sprint.updatedAt,
      },
    });
    return toDomain(created);
  }

  async findByProjectId(projectId: string): Promise<Sprint[]> {
    const rows = await this.prisma.sprint.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "asc" }],
    });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Sprint | null> {
    const row = await this.prisma.sprint.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async update(sprint: Sprint): Promise<Sprint> {
    const updated = await this.prisma.sprint.update({
      where: { id: sprint.id },
      data: {
        milestoneId: sprint.milestoneId,
        name: sprint.name.value,
        description: sprint.description,
      },
    });
    return toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.sprint.delete({ where: { id } });
  }
}

type PrismaSprintRow = {
  id: string;
  projectId: string;
  milestoneId: string | null;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toDomain(row: PrismaSprintRow): Sprint {
  return new Sprint({
    id: row.id,
    projectId: row.projectId,
    milestoneId: row.milestoneId,
    name: new SprintName(row.name),
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}