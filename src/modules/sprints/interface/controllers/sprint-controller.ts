import type { Request, Response, NextFunction } from "express";
import type { CreateSprint } from "@sprints/application/use-cases/create-sprint.js";
import type { ListSprints } from "@sprints/application/use-cases/list-sprints.js";
import type { CreateSprintDto } from "@sprints/application/dto/sprint-dto.js";

/**
 * SprintController — the HTTP boundary for /api/projects/:projectId/sprints.
 *
 * Mirrors MilestoneController. Each method is an Express handler that
 * delegates to a use case and forwards errors via next(). Domain
 * AppErrors (400/403/404) flow through the global error handler.
 */
export class SprintController {
  constructor(
    private readonly createSprint: CreateSprint,
    private readonly listSprints: ListSprints,
  ) {}

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const actorId = req.user!.id;
      const dto = req.body as CreateSprintDto;

      const result = await this.createSprint.execute(projectId, actorId, dto);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const actorId = req.user!.id;

      const result = await this.listSprints.execute(projectId, actorId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}