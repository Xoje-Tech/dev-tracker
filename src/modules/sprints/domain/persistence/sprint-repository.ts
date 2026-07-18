import type { Sprint } from "../sprint.js";

export interface SprintRepository {
  create(sprint: Sprint): Promise<Sprint>;
  findByProjectId(projectId: string): Promise<Sprint[]>;
}
