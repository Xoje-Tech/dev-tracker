import { BaseEntity } from "@shared/domain/base-entity.js";
import { SprintName } from "./value-objects/sprint-name.js";

export class Sprint extends BaseEntity {
  readonly projectId: string;
  readonly milestoneId: string | null;
  readonly name: SprintName;
  readonly description: string | null;

  constructor(params: {
    id: string;
    projectId: string;
    milestoneId: string | null;
    name: SprintName;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id, params.createdAt, params.updatedAt);
    this.projectId = params.projectId;
    this.milestoneId = params.milestoneId;
    this.name = params.name;
    this.description = params.description;
  }
}
