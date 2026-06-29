import { BaseEntity } from "@shared/domain/base-entity.js";

export class ProjectMember extends BaseEntity {
  readonly projectId: string;
  readonly userId: string;
  readonly role: string;

  constructor(params: {
    id: string;
    projectId: string;
    userId: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id, params.createdAt, params.updatedAt);
    this.projectId = params.projectId;
    this.userId = params.userId;
    this.role = params.role;
  }
}
