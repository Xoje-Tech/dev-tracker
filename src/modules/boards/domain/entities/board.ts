import { BaseEntity } from "../../../shared/domain/base-entity.js";

export class Board extends BaseEntity {
  readonly projectId: string;

  constructor(params: {
    id: string;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id, params.createdAt, params.updatedAt);
    this.projectId = params.projectId;
  }
}
