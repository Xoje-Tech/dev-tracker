import type { Sprint } from "../sprint.js";

export interface SprintRepository {
  create(sprint: Sprint): Promise<Sprint>;
  findById(id: string): Promise<Sprint | null>;
  findByProjectId(projectId: string): Promise<Sprint[]>;
  update(sprint: Sprint): Promise<Sprint>;
  delete(id: string): Promise<void>;
}
