import type { UserRepository } from "@auth/domain/repositories/user-repository.js";
import { Password } from "@auth/domain/value-objects/password.js";

export class AuthenticateUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(params: {
    email: string;
    password: string;
  }): Promise<{ id: string; email: string; name: string; apiKey: string | null } | null> {
    const user = await this.userRepository.findByEmail(params.email);
    if (!user) {
      return null;
    }

    const password = Password.fromHash(user.passwordHash);
    const isValid = await password.compare(params.password);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email.value,
      name: user.name,
      apiKey: user.apiKey,
    };
  }
}
