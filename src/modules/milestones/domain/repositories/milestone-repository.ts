import type { Milestone } from "@milestones/domain/entities/milestone.js";

/**
 * Filter applied when listing milestones for a project.
 *
 * `includeArchived: false` (default) hides soft-deleted (archived)
 * milestones so the default list shows only live ones. Pass
 * `includeArchived: true` to get everything, e.g. for an admin view.
 */
export interface ListMilestonesFilter {
  includeArchived?: boolean;
}

/**
 * MilestoneRepository — the persistence-port contract for milestones.
 *
 * Domain code (use cases) depends on this interface, not on the
 * Prisma-backed implementation. Infrastructure owns the adapter.
 */
export interface MilestoneRepository {
  /** Find a single milestone by id (across all projects). */
  findById(id: string): Promise<Milestone | null>;

  /**
   * List milestones for a project. Ordering is:
   *   targetDate ASC NULLS LAST, createdAt ASC
   *
   * The `filter.includeArchived` flag toggles whether archived milestones
   * appear in the result.
   */
  findByProjectId(
    projectId: string,
    filter?: ListMilestonesFilter,
  ): Promise<Milestone[]>;

  /** Insert a new milestone. */
  create(milestone: Milestone): Promise<Milestone>;

  /** Update an existing milestone (full snapshot). */
  update(milestone: Milestone): Promise<Milestone>;

  /** Hard-delete a milestone. Sprints referencing it go to null via FK. */
  delete(id: string): Promise<void>;
}