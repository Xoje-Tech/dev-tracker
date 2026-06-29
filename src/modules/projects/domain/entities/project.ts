import { BaseEntity } from "@shared/domain/base-entity.js";

export class Project extends BaseEntity {
  readonly name: string;
  readonly description: string | null;
  readonly archived: boolean;

  constructor(params: {
    id: string;
    name: string;
    description: string | null;
    archived: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id, params.createdAt, params.updatedAt);
    this.name = params.name;
    this.description = params.description;
    this.archived = params.archived;
  }
}
