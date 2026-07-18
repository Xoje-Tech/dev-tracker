import { BaseEntity } from "@shared/domain/base-entity.js";
import { MilestoneStatus } from "@milestones/domain/value-objects/milestone-status.js";

/**
 * Milestone — the domain aggregate for a project milestone.
 *
 * The Prisma column name `name` is mapped to the conceptual `title` field
 * via the repository's toDomain function. This entity exposes `title` so
 * callers (use cases, controllers, tests) speak the domain language; the
 * schema column name is an infrastructure detail.
 *
 * Field map (domain <-> schema):
 *   title       <-> name        (String, 1-120 chars)
 *   dueDate     <-> targetDate  (Date | null)
 *   status      <-> status      ("open" | "closed" | "archived")
 *   description <-> description (String | null)
 *
 * The status is a domain VO (MilestoneStatus) — domain code never holds a
 * raw string. Persistence round-trips through .value <-> .toString().
 */
export class Milestone extends BaseEntity {
  readonly projectId: string;
  readonly title: string;
  readonly description: string | null;
  readonly dueDate: Date | null;
  readonly status: MilestoneStatus;

  constructor(params: {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    status: MilestoneStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id, params.createdAt, params.updatedAt);
    this.projectId = params.projectId;
    this.title = params.title;
    this.description = params.description;
    this.dueDate = params.dueDate;
    this.status = params.status;
  }
}