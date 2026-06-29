import type { TagRepository } from "@tags/domain/repositories/tag-repository.js";
import { AppError } from "@shared/infrastructure/http/error-handler.js";

export class AddTagToTask {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(taskId: string, tagId: string): Promise<void> {
    // Verify tag exists
    const tag = await this.tagRepository.findById(tagId);
    if (!tag) {
      throw new AppError(404, "Tag not found");
    }

    // Idempotent — upsert handles "already exists" gracefully
    // Prisma will throw P2003 if taskId doesn't exist (FK violation)
    await this.tagRepository.addTagToTask(taskId, tagId);
  }
}
