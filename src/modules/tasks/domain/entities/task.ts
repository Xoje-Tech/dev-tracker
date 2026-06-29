import { BaseEntity } from "../../../shared/domain/base-entity.js";

export class Task extends BaseEntity {
  readonly columnId: string;
  readonly title: string;
  readonly description: string | null;
  readonly priority: string;
  readonly order: number;
  readonly assigneeId: string | null;
  readonly creatorId: string;

  constructor(params: {
    id: string;
    columnId: string;
    title: string;
    description: string | null;
    priority: string;
    order: number;
    assigneeId: string | null;
    creatorId: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id, params.createdAt, params.updatedAt);
    this.columnId = params.columnId;
    this.title = params.title;
    this.description = params.description;
    this.priority = params.priority;
    this.order = params.order;
    this.assigneeId = params.assigneeId;
    this.creatorId = params.creatorId;
  }
}
