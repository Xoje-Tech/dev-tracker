import type { TagRepository } from "@tags/domain/repositories/tag-repository.js";

export class RemoveTagFromTask {
  constructor(_tagRepository: TagRepository) {}

  async execute(_taskId: string, _tagId: string): Promise<void> {
    throw new Error("Not implemented");
  }
}
