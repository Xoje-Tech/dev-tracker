import { AppError } from "@shared/infrastructure/http/error-handler.js";

/**
 * MilestoneTitle — value object for a milestone's human-readable title.
 *
 * The Prisma column is named `name` (see schema.prisma) — the domain VO is
 * called `MilestoneTitle` because that's the concept it represents and the
 * naming we want in the API contract. Mapping happens at the
 * PrismaMilestoneRepository boundary.
 *
 * Invariants:
 *   - non-empty after trimming
 *   - max 120 characters after trimming
 *
 * The 120 cap is a deliberate product decision: a milestone title is short
 * (e.g. "v1.0 GA", "Q3 Marketing Push") and forcing a longer description
 * into the title field would obscure the name field's purpose. The
 * description field is available on Milestone for the longer narrative.
 *
 * Validation errors throw AppError(400) so the global error handler
 * translates them to a 400 JSON response — the controller does not need
 * to catch them.
 */
export class MilestoneTitle {
  readonly value: string;

  constructor(value: string) {
    if (typeof value !== "string") {
      throw new AppError(400, "Milestone title must be a string");
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new AppError(400, "Milestone title cannot be empty");
    }
    if (trimmed.length > 120) {
      throw new AppError(
        400,
        "Milestone title cannot exceed 120 characters",
      );
    }
    this.value = trimmed;
  }
}