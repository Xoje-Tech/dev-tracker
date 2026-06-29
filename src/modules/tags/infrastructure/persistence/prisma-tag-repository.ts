import type { TagRepository } from "../../domain/repositories/tag-repository.js";
import type { Tag } from "../../domain/entities/tag.js";
import type { PrismaClient } from "@prisma/client";

export class PrismaTagRepository implements TagRepository {
  constructor(_prisma: PrismaClient) {}

  async findById(_id: string): Promise<Tag | null> {
    throw new Error("Not implemented");
  }

  async findAll(): Promise<Tag[]> {
    throw new Error("Not implemented");
  }

  async create(): Promise<Tag> {
    throw new Error("Not implemented");
  }

  async addTagToTask(_taskId: string, _tagId: string): Promise<void> {
    throw new Error("Not implemented");
  }

  async removeTagFromTask(_taskId: string, _tagId: string): Promise<void> {
    throw new Error("Not implemented");
  }
}
