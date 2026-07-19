/**
 * Domain-specific errors for the milestones module.
 *
 * Each error carries a status code so the controller can translate it into
 * an HTTP response without knowing the rule that fired. The shared
 * `AppError` (src/modules/shared/infrastructure/http/error-handler.ts) is
 * the transport-level envelope; these are domain-meaningful subclasses
 * that use cases throw.
 */
import { AppError } from "@shared/infrastructure/http/error-handler.js";

/** Thrown when a project does not exist or is not visible to the actor. */
export class MilestoneProjectNotFoundError extends AppError {
  constructor(projectId: string) {
    super(404, `Project not found: ${projectId}`);
    this.name = "MilestoneProjectNotFoundError";
  }
}

/** Thrown when a milestone id does not exist within the given project. */
export class MilestoneNotFoundError extends AppError {
  constructor(milestoneId: string) {
    super(404, `Milestone not found: ${milestoneId}`);
    this.name = "MilestoneNotFoundError";
  }
}

/** Thrown when the actor is authenticated but not a member of the project. */
export class MilestoneForbiddenError extends AppError {
  constructor(message = "Not a member of this project") {
    super(403, message);
    this.name = "MilestoneForbiddenError";
  }
}

/**
 * Thrown when a status transition is illegal — e.g. trying to close an
 * already-closed milestone, or to reopen an archived one. Surfaced as
 * 409 Conflict because the resource exists but the requested state change
 * conflicts with its current state.
 */
export class MilestoneInvalidStatusTransitionError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = "MilestoneInvalidStatusTransitionError";
  }
}