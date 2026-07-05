import { BaseEntity } from "@shared/domain/base-entity.js";

export class Project extends BaseEntity {
  readonly name: string;
  readonly description: string | null;
  readonly repoUrl: string | null;
  readonly archived: boolean;

  constructor(params: {
    id: string;
    name: string;
    description: string | null;
    repoUrl: string | null;
    archived: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id, params.createdAt, params.updatedAt);
    this.name = params.name;
    this.description = params.description;
    this.repoUrl = params.repoUrl;
    this.archived = params.archived;
  }
}
