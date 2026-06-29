import type { TagRepository } from "../../domain/repositories/tag-repository.js";

export class ListTags {
  constructor(_tagRepository: TagRepository) {}

  async execute(): Promise<unknown[]> {
    throw new Error("Not implemented");
  }
}
