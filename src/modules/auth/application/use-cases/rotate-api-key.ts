import type { UserRepository } from "../../domain/repositories/user-repository.js";
import { ApiKey } from "../../domain/value-objects/api-key.js";

export class RotateApiKey {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<{ apiKey: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newKey = ApiKey.generate();
    const updated = user.withApiKey(newKey);
    await this.userRepository.update(updated);

    return { apiKey: newKey.value };
  }
}
