import type { Request, Response, NextFunction } from "express";
import type { CreateProject } from "@projects/application/use-cases/create-project.js";
import type { ListProjects } from "@projects/application/use-cases/list-projects.js";
import type { GetProject } from "@projects/application/use-cases/get-project.js";
import type { UpdateProject } from "@projects/application/use-cases/update-project.js";
import type { ArchiveProject } from "@projects/application/use-cases/archive-project.js";
import type { CreateProjectDto } from "@projects/application/dto/create-project-dto.js";
import type { UpdateProjectDto } from "@projects/application/dto/update-project-dto.js";
import { env } from "@config/env.js";

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

  getMemories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const project = await this.getProject.execute(id, userId);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const engramUrl = `${env.ENGRAM_API_URL}/observations?project=${encodeURIComponent(project.name)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout for fast response

      try {
        const response = await fetch(engramUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const memories = await response.json();
          res.json({ memories, warning: null });
        } else {
          res.json({ memories: [], warning: `Engram API returned status ${response.status}` });
        }
      } catch (err) {
        clearTimeout(timeoutId);
        res.json({ memories: [], warning: "Engram API offline or unreachable" });
      }
    } catch (error) {
      next(error);
    }
  };
}
