import type { TagRepository } from "../../domain/repositories/tag-repository.js";
import type { TagDto } from "../dto/tag-dto.js";

export class CreateTag {
  constructor(_tagRepository: TagRepository) {}

  async execute(_dto: TagDto): Promise<{ id: string }> {
    throw new Error("Not implemented");
  }
}
