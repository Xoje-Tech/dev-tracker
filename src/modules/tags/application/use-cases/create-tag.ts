import type { TagRepository } from "@tags/domain/repositories/tag-repository.js";
import type { TagDto } from "@tags/application/dto/tag-dto.js";
import type { TagResponseDto } from "@tags/application/dto/tag-response-dto.js";
import { Tag } from "@tags/domain/entities/tag.js";
import { TagName } from "@tags/domain/value-objects/tag-name.js";
import { AppError } from "@shared/infrastructure/http/error-handler.js";

export class CreateTag {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(dto: TagDto): Promise<TagResponseDto> {
    const name = new TagName(dto.name);

    // Check uniqueness (case-insensitive via normalized name)
    const existing = await this.tagRepository.findByName(name.value);
    if (existing) {
      throw new AppError(409, `Tag "${name.value}" already exists`);
    }

    const now = new Date();
    const id = crypto.randomUUID();

    const tag = new Tag({
      id,
      name: name.value,
      color: dto.color ?? "#6366f1",
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.tagRepository.create(tag);

    return {
      id: saved.id,
      name: saved.name,
      color: saved.color,
    };
  }
}
