import type { TagRepository } from "@tags/domain/repositories/tag-repository.js";
import { AppError } from "@shared/infrastructure/http/error-handler.js";

export class RemoveTagFromTask {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(taskId: string, tagId: string): Promise<void> {
    // Verify tag exists
    const tag = await this.tagRepository.findById(tagId);
    if (!tag) {
      throw new AppError(404, "Tag not found");
    }

    await this.tagRepository.removeTagFromTask(taskId, tagId);
  }
}
