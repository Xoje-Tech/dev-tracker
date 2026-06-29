import type { UserRepository } from "@auth/domain/repositories/user-repository.js";
import { User } from "@auth/domain/entities/user.js";
import { Email } from "@auth/domain/value-objects/email.js";
import { Password } from "@auth/domain/value-objects/password.js";

export class RegisterUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(params: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ id: string; email: string; name: string; apiKey: string | null }> {
    const email = new Email(params.email);

    const existing = await this.userRepository.findByEmail(email.value);
    if (existing) {
      throw new Error("Email already registered");
    }

    const password = await Password.create(params.password);
    const id = crypto.randomUUID();

    const user = User.create({ id, email, name: params.name, password });
    const saved = await this.userRepository.create(user);

    return {
      id: saved.id,
      email: saved.email.value,
      name: saved.name,
      apiKey: saved.apiKey,
    };
  }
}
