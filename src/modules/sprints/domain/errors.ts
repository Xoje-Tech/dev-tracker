/**
 * Domain-specific errors for the sprints module.
 *
 * Mirrors the milestones/errors.ts pattern: each error carries an HTTP
 * status code so the controller can translate it without knowing the rule.
 */
import { AppError } from "@shared/infrastructure/http/error-handler.js";

/** Thrown when a project does not exist or is not visible to the actor. */
export class SprintProjectNotFoundError extends AppError {
  constructor(projectId: string) {
    super(404, `Project not found: ${projectId}`);
    this.name = "SprintProjectNotFoundError";
  }
}

/** Thrown when a sprint id does not exist within the given project. */
export class SprintNotFoundError extends AppError {
  constructor(sprintId: string) {
    super(404, `Sprint not found: ${sprintId}`);
    this.name = "SprintNotFoundError";
  }
}

/** Thrown when the actor is authenticated but not a member of the project. */
export class SprintForbiddenError extends AppError {
  constructor(message = "Not a member of this project") {
    super(403, message);
    this.name = "SprintForbiddenError";
  }
}

/**
 * Thrown when the sprint's milestoneId points to a milestone that does not
 * belong to the same project (cross-project linkage). Per spec this is 400,
 * not 403 — the request is malformed, not unauthorised.
 */
export class SprintCrossProjectMilestoneError extends AppError {
  constructor(milestoneId: string) {
    super(
      400,
      `milestoneId ${milestoneId} does not belong to this project`,
    );
    this.name = "SprintCrossProjectMilestoneError";
  }
}

/** Thrown when the milestoneId provided does not exist at all. */
export class SprintMilestoneNotFoundError extends AppError {
  constructor(milestoneId: string) {
    super(400, `milestoneId ${milestoneId} does not exist`);
    this.name = "SprintMilestoneNotFoundError";
  }
}