import { BaseEntity } from "@shared/domain/base-entity.js";

export class Tag extends BaseEntity {
  readonly name: string;
  readonly color: string;

  constructor(params: {
    id: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id, params.createdAt, params.updatedAt);
    this.name = params.name;
    this.color = params.color;
  }
}
