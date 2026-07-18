import type { PrismaClient, Milestone as PrismaMilestone } from "@prisma/client";
import type {
  MilestoneRepository,
  ListMilestonesFilter,
} from "@milestones/domain/repositories/milestone-repository.js";
import { Milestone } from "@milestones/domain/entities/milestone.js";
import { MilestoneStatus } from "@milestones/domain/value-objects/milestone-status.js";

/**
 * PrismaMilestoneRepository — adapter for the MilestoneRepository port.
 *
 * Translates between the domain entity (which exposes `title`, `dueDate`,
 * status as a VO) and the Prisma row (which uses `name`, `targetDate`,
 * status as a freeform string with default "PLANNED").
 *
 * Ordering contract (matches the domain ListMilestonesFilter):
 *   targetDate ASC NULLS LAST, createdAt ASC
 *
 * Note on SQLite NULLS LAST: SQLite does NOT support `NULLS LAST` syntax.
 * We emulate it by sorting ascending with a CASE that pushes NULL to the
 * end. Prisma passes raw SQL fragments via `prisma.sql`, but the simplest
 * cross-version Prisma approach is to sort on the raw `targetDate` and
 * then post-process — OR sort with a tiny `sortKey` computed via $queryRaw.
 * Here we use Prisma's orderBy with two keys and rely on the schema's
 * `targetDate` being indexed; SQLite's NULL ordering is ASC by default
 * (NULL < any value), so we add a secondary explicit nulls-last pass via
 * $queryRaw if the caller demands strict ordering. For now the default
 * ASC ordering puts NULL first, which is the OPPOSITE of the spec. We
 * resolve this with a follow-up $queryRaw.
 */
function toDomain(row: PrismaMilestone): Milestone {
  return new Milestone({
    id: row.id,
    projectId: row.projectId,
    title: row.name,
    description: row.description,
    dueDate: row.targetDate,
    status: new MilestoneStatus(row.status),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class PrismaMilestoneRepository implements MilestoneRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Milestone | null> {
    const row = await this.prisma.milestone.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByProjectId(
    projectId: string,
    filter: ListMilestonesFilter = {},
  ): Promise<Milestone[]> {
    const includeArchived = filter.includeArchived ?? false;
    const where: {
      projectId: string;
      status?: { not: string };
    } = { projectId };
    if (!includeArchived) {
      where.status = { not: "archived" };
    }

    // Prisma 6.x orderBy supports `nulls: "last"` natively, so we use
    // findMany instead of $queryRaw. This keeps the query portable and
    // avoids the template-literal parameter expansion that broke with
    // conditional SQL fragments. SQLite sorts NULL first when ascending
    // by default — `nulls: "last"` overrides that for our ordering
    // contract: targetDate ASC NULLS LAST, then createdAt ASC.
    const rows = await this.prisma.milestone.findMany({
      where,
      orderBy: [
        { targetDate: { sort: "asc", nulls: "last" } },
        { createdAt: "asc" },
      ],
    });
    return rows.map(toDomain);
  }

  async create(milestone: Milestone): Promise<Milestone> {
    const created = await this.prisma.milestone.create({
      data: {
        id: milestone.id,
        projectId: milestone.projectId,
        name: milestone.title,
        description: milestone.description,
        targetDate: milestone.dueDate,
        status: milestone.status.value,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt,
      },
    });
    return toDomain(created);
  }

  async update(milestone: Milestone): Promise<Milestone> {
    const updated = await this.prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        name: milestone.title,
        description: milestone.description,
        targetDate: milestone.dueDate,
        status: milestone.status.value,
      },
    });
    return toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.milestone.delete({ where: { id } });
  }
}