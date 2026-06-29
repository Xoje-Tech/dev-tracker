import type { User as PrismaUserModel } from "@prisma/client";
import type { UserRepository } from "../../domain/repositories/user-repository.js";
import { User } from "../../domain/entities/user.js";
import { Email } from "../../domain/value-objects/email.js";
import type { PrismaClient } from "@prisma/client";

function toDomain(prismaUser: PrismaUserModel): User {
  return new User({
    id: prismaUser.id,
    email: new Email(prismaUser.email),
    name: prismaUser.name,
    passwordHash: prismaUser.passwordHash,
    apiKey: prismaUser.apiKey,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  });
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({ where: { id } });
    return found ? toDomain(found) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({ where: { email } });
    return found ? toDomain(found) : null;
  }

  async findByApiKey(apiKey: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({ where: { apiKey } });
    return found ? toDomain(found) : null;
  }

  async create(user: User): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email.value,
        name: user.name,
        passwordHash: user.passwordHash,
        apiKey: user.apiKey,
      },
    });
    return toDomain(created);
  }

  async update(user: User): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email.value,
        name: user.name,
        passwordHash: user.passwordHash,
        apiKey: user.apiKey,
      },
    });
    return toDomain(updated);
  }
}
