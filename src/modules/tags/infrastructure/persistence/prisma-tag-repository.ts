import type { PrismaClient, Tag as PrismaTag } from "@prisma/client";
import type { TagRepository } from "@tags/domain/repositories/tag-repository.js";
import { Tag } from "@tags/domain/entities/tag.js";

function toDomain(t: PrismaTag): Tag {
  return new Tag({
    id: t.id,
    name: t.name,
    color: t.color,
  });
}

export class PrismaTagRepository implements TagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Tag | null> {
    const found = await this.prisma.tag.findUnique({ where: { id } });
    return found ? toDomain(found) : null;
  }

  async findByName(name: string): Promise<Tag | null> {
    const found = await this.prisma.tag.findUnique({ where: { name } });
    return found ? toDomain(found) : null;
  }

  async findAll(): Promise<Tag[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: "asc" },
    });
    return tags.map(toDomain);
  }

  async create(tag: Tag): Promise<Tag> {
    const created = await this.prisma.tag.create({
      data: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
      },
    });
    return toDomain(created);
  }

  async addTagToTask(taskId: string, tagId: string): Promise<void> {
    await this.prisma.taskTag.upsert({
      where: {
        taskId_tagId: { taskId, tagId },
      },
      update: {},
      create: { taskId, tagId },
    });
  }

  async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
    await this.prisma.taskTag.delete({
      where: {
        taskId_tagId: { taskId, tagId },
      },
    });
  }

  async getTagsForTask(taskId: string): Promise<Tag[]> {
    const taskTags = await this.prisma.taskTag.findMany({
      where: { taskId },
      include: { tag: true },
    });
    return taskTags.map((tt) => toDomain(tt.tag));
  }
}
