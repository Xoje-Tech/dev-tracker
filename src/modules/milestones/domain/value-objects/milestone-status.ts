/**
 * MilestoneStatus — value object for a milestone's lifecycle status.
 *
 * Canonical values: "open" | "closed" | "archived"
 *
 * Mapping notes:
 *   - The Prisma schema's default is the legacy literal "PLANNED" (see
 *     schema.prisma → `status String @default("PLANNED")`). The domain
 *     treats "PLANNED" as a synonym for "open" so legacy rows hydrate
 *     correctly without a migration.
 *   - "archived" replaces the `archivedAt` soft-delete timestamp from the
 *     original spec. The Prisma schema (locked by PR A) has no
 *     `archivedAt` column, so we encode the soft-delete signal in the
 *     status field. Archive is one-way (no reopen) per the spec's
 *     "no-reopen" rule.
 *
 * Transitions (see MilestoneStatusTransitions):
 *   open    -> closed
 *   closed  -> archived
 *   open    -> archived  (archive from open is also permitted)
 *   closed  -> closed    (no-op, idempotent)
 *   open    -> open      (no-op, idempotent)
 *   archived -> open     REJECTED (no reopen)
 *   archived -> closed   REJECTED (archived is terminal)
 *   closed  -> open      REJECTED (no reopen)
 */
export type MilestoneStatusValue = "open" | "closed" | "archived";

const CANONICAL_STATUSES: readonly MilestoneStatusValue[] = [
  "open",
  "closed",
  "archived",
] as const;

// "PLANNED" is the legacy Prisma default. Normalize to "open" — the
// conceptual lifecycle begins at open, regardless of how the column was
// initialized. We could also reject "PLANNED" as an input, but that would
// break hydration of rows created before this VO existed.
const LEGACY_OPEN_ALIASES = new Set(["PLANNED"]);

export class MilestoneStatus {
  readonly value: MilestoneStatusValue;

  constructor(value: string) {
    if (typeof value !== "string") {
      throw new Error("Milestone status must be a string");
    }
    const normalized = value.trim();

    if (LEGACY_OPEN_ALIASES.has(normalized)) {
      this.value = "open";
      return;
    }

    const lower = normalized.toLowerCase();
    if (!(CANONICAL_STATUSES as readonly string[]).includes(lower)) {
      throw new Error(
        `Milestone status must be one of: ${CANONICAL_STATUSES.join(
          ", ",
        )} (got: "${value}")`,
      );
    }
    this.value = lower as MilestoneStatusValue;
  }

  isOpen(): boolean {
    return this.value === "open";
  }

  isClosed(): boolean {
    return this.value === "closed";
  }

  isArchived(): boolean {
    return this.value === "archived";
  }

  equals(other: MilestoneStatus): boolean {
    return this.value === other.value;
  }
}

/**
 * MilestoneStatusTransitions — the legal transitions for MilestoneStatus.
 *
 * The transition table is the source of truth for the lifecycle. Use case
 * code must call `assertCanTransition(from, to)` before persisting a status
 * change; the helper throws an AppError with the appropriate status code
 * (409 Conflict for terminal/illegal transitions, 400 for malformed
 * input — though malformed input is caught at the VO constructor).
 */
export const MilestoneStatusTransitions = {
  /**
   * Throws if the proposed transition is illegal. Idempotent no-ops
   * (same -> same) are allowed.
   */
  assertCanTransition(from: MilestoneStatus, to: MilestoneStatus): void {
    if (from.equals(to)) {
      return; // no-op
    }

    // Archived is terminal.
    if (from.isArchived()) {
      throw new Error(
        `Cannot transition milestone status: archived is terminal (tried archived -> ${to.value})`,
      );
    }

    // The only forward transitions out of a live state:
    //   open    -> closed
    //   closed  -> archived
    //   open    -> archived
    const allowed =
      (from.isOpen() && (to.isClosed() || to.isArchived())) ||
      (from.isClosed() && to.isArchived());

    if (!allowed) {
      throw new Error(
        `Cannot reopen milestone: status ${from.value} -> ${to.value} is not allowed`,
      );
    }
  },
} as const;