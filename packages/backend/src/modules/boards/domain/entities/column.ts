import { BaseEntity } from "@shared/domain/base-entity.js";

export class Column extends BaseEntity {
  readonly boardId: string;
  readonly title: string;
  readonly order: number;

  constructor(params: {
    id: string;
    boardId: string;
    title: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id, params.createdAt, params.updatedAt);
    this.boardId = params.boardId;
    this.title = params.title;
    this.order = params.order;
  }
}
