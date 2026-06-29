import type { z } from "zod";
import type {
  registerSchema,
  loginSchema,
  createProjectSchema,
  updateProjectSchema,
  createColumnSchema,
  updateColumnSchema,
  createTaskSchema,
  updateTaskSchema,
  createTagSchema,
} from "../schemas/index.js";

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;

export interface UserDTO {
  id: string;
  email: string;
  name: string;
}

export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnDTO {
  id: string;
  boardId: string;
  title: string;
  order: number;
  tasks: TaskDTO[];
}

export interface TaskDTO {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  order: number;
  assigneeId: string | null;
  creatorId: string;
  tags: TagDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface TagDTO {
  id: string;
  name: string;
  color: string;
}

export interface BoardDTO {
  id: string;
  projectId: string;
  columns: ColumnDTO[];
}
