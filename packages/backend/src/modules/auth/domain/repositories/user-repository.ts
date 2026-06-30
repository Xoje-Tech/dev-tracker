import type { User } from "@auth/domain/entities/user.js";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByApiKey(apiKey: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
}
