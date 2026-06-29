/**
 * Projects module — domain types.
 * Mirrors backend src/modules/projects/application/dto/*.ts.
 */

export interface Project {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
}
