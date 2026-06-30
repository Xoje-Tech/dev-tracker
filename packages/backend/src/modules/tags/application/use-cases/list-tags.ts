import type { TagRepository } from "@tags/domain/repositories/tag-repository.js";
import type { TagResponseDto } from "@tags/application/dto/tag-response-dto.js";

export class ListTags {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(): Promise<TagResponseDto[]> {
    const tags = await this.tagRepository.findAll();
    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    }));
  }
}
