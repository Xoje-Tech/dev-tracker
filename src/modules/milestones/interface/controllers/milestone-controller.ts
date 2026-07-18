import type { Request, Response, NextFunction } from "express";
import type { CreateMilestone } from "@milestones/application/use-cases/create-milestone.js";
import type { ListMilestones } from "@milestones/application/use-cases/list-milestones.js";
import type { UpdateMilestone } from "@milestones/application/use-cases/update-milestone.js";
import type { DeleteMilestone } from "@milestones/application/use-cases/delete-milestone.js";
import type { ArchiveMilestone } from "@milestones/application/use-cases/archive-milestone.js";
import type { CreateMilestoneDto, UpdateMilestoneDto } from "@milestones/application/dto/milestone-dto.js";
import type {
  ListMilestonesFilter,
} from "@milestones/domain/repositories/milestone-repository.js";

/**
 * MilestoneController — the HTTP boundary for /api/projects/:projectId/milestones.
 *
 * Each method is an Express handler that:
 *   1. Pulls inputs from req (params, query, body, user).
 *   2. Delegates to a use case.
 *   3. Serializes the result or forwards errors via next().
 *
 * Errors from use cases are domain-meaningful AppErrors (400/403/404/409).
 * They flow through the global error handler at src/app.ts which converts
 * them to JSON responses — the controller does NOT catch them.
 */
export class MilestoneController {
  constructor(
    private readonly createMilestone: CreateMilestone,
    private readonly listMilestones: ListMilestones,
    private readonly updateMilestone: UpdateMilestone,
    private readonly deleteMilestone: DeleteMilestone,
    private readonly archiveMilestone: ArchiveMilestone,
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

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const actorId = req.user!.id;
      // The canonical ?includeArchived=true flag controls whether archived
      // milestones appear in the list; the legacy ?archived=true alias is
      // honoured for backwards compatibility with the create/list commits.
      // Default is live-only.
      const includeArchived = parseIncludeArchived(req.query);
      const filter: ListMilestonesFilter = { includeArchived };
      const result = await this.listMilestones.execute(
        projectId,
        actorId,
        filter,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const milestoneId = req.params.milestoneId as string;
      const actorId = req.user!.id;
      const dto = req.body as UpdateMilestoneDto;
      const result = await this.updateMilestone.execute(
        projectId,
        milestoneId,
        actorId,
        dto,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const milestoneId = req.params.milestoneId as string;
      const actorId = req.user!.id;
      await this.deleteMilestone.execute(projectId, milestoneId, actorId);
      // 204 No Content per spec; Express will not send a body when status
      // is set to 204 explicitly here.
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  archive = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const milestoneId = req.params.milestoneId as string;
      const actorId = req.user!.id;
      const result = await this.archiveMilestone.execute(
        projectId,
        milestoneId,
        actorId,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * parseIncludeArchived — accepts both `?includeArchived=true` (canonical
 * name, used by the archive cluster) and `?archived=true` (legacy alias
 * from the create/list clusters). Returns true only when one of the two
 * flag values is "true" (case-insensitive). Anything else defaults to false.
 *
 * `req.query` is loosely typed by Express's typings (string keys, possibly
 * nested objects, possibly arrays). We coerce safely here without pulling
 * in the `qs` package — its types are not a direct dependency of this
 * project.
 */
function parseIncludeArchived(query: Request["query"]): boolean {
  const canonical = readStringFlag(query["includeArchived"]);
  if (canonical !== undefined) return canonical;
  const alias = readStringFlag(query["archived"]);
  return alias ?? false;
}

function readStringFlag(value: unknown): boolean | undefined {
  if (typeof value !== "string") return undefined;
  return value.toLowerCase() === "true";
}