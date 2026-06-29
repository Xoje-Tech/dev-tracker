import type { TagRepository } from "../../domain/repositories/tag-repository.js";

export class AddTagToTask {
  constructor(_tagRepository: TagRepository) {}

  async execute(_taskId: string, _tagId: string): Promise<void> {
    throw new Error("Not implemented");
  }
}
