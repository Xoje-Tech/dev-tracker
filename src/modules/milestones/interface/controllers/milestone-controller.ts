import type { Request, Response, NextFunction } from "express";
import type { CreateMilestone } from "@milestones/application/use-cases/create-milestone.js";
import type { CreateMilestoneDto } from "@milestones/application/dto/milestone-dto.js";

/**
 * MilestoneController — the HTTP boundary for /api/projects/:projectId/milestones.
 *
 * Each method is an Express handler that:
 *   1. Pulls inputs from req (params, body, user).
 *   2. Delegates to a use case.
 *   3. Serializes the result or forwards errors via next().
 *
 * Errors from use cases are domain-meaningful AppErrors (400/403/404/409).
 * They flow through the global error handler at src/app.ts which converts
 * them to JSON responses — the controller does NOT catch them.
 *
 * This controller is the partial implementation for PR B; List/Update/
 * Delete/Archive are added in subsequent commits following the same
 * TDD cluster discipline.
 */
export class MilestoneController {
  constructor(
    private readonly createMilestone: CreateMilestone,
  ) {}

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const actorId = req.user!.id;
      const dto = req.body as CreateMilestoneDto;
      const result = await this.createMilestone.execute(
        projectId,
        actorId,
        dto,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };
}