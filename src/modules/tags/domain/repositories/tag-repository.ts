import type { Tag } from "@tags/domain/entities/tag.js";

export interface TagRepository {
  findById(id: string): Promise<Tag | null>;
  findByName(name: string): Promise<Tag | null>;
  findAll(): Promise<Tag[]>;
  create(tag: Tag): Promise<Tag>;
  addTagToTask(taskId: string, tagId: string): Promise<void>;
  removeTagFromTask(taskId: string, tagId: string): Promise<void>;
  getTagsForTask(taskId: string): Promise<Tag[]>;
}
