import { AppError } from "@shared/infrastructure/http/error-handler.js";

/**
 * SprintName — value object enforcing the spec invariant:
 * 1-120 chars after trimming. Empty / whitespace-only / over-long names
 * throw AppError(400) so the controller does not have to know the rule.
 *
 * Mirrors MilestoneTitle (the same 1-120 invariant applies per spec).
 */
export class SprintName {
  readonly value: string;

  constructor(value: unknown) {
    if (typeof value !== "string") {
      throw new AppError(400, "name must be a string");
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new AppError(400, "name cannot be empty");
    }
    if (trimmed.length > 120) {
      throw new AppError(400, "name cannot exceed 120 characters");
    }
    this.value = trimmed;
  }
}