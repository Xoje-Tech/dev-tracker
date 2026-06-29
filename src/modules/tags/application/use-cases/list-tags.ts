import type { TagRepository } from "@tags/domain/repositories/tag-repository.js";

export class ListTags {
  constructor(_tagRepository: TagRepository) {}

  async execute(): Promise<unknown[]> {
    throw new Error("Not implemented");
  }
}
