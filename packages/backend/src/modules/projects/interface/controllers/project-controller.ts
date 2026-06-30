import type { Request, Response, NextFunction } from "express";
import type { CreateProject } from "@projects/application/use-cases/create-project.js";
import type { ListProjects } from "@projects/application/use-cases/list-projects.js";
import type { GetProject } from "@projects/application/use-cases/get-project.js";
import type { UpdateProject } from "@projects/application/use-cases/update-project.js";
import type { ArchiveProject } from "@projects/application/use-cases/archive-project.js";
import type { CreateProjectDto } from "@projects/application/dto/create-project-dto.js";
import type { UpdateProjectDto } from "@projects/application/dto/update-project-dto.js";

export class ProjectController {
  constructor(
    private readonly createProject: CreateProject,
    private readonly listProjects: ListProjects,
    private readonly getProject: GetProject,
    private readonly updateProject: UpdateProject,
    private readonly archiveProject: ArchiveProject,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateProjectDto;
      const ownerId = req.user!.id;
      const result = await this.createProject.execute(dto, ownerId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.listProjects.execute(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const result = await this.getProject.execute(id, userId);
      if (!result) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = req.body as UpdateProjectDto;
      const result = await this.updateProject.execute(id, data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.archiveProject.execute(id);
      res.json({ message: "Project archived" });
    } catch (error) {
      next(error);
    }
  };
}
