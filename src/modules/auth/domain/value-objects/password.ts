import bcrypt from "bcryptjs";

export class Password {
  readonly hash: string;

  private static readonly SALT_ROUNDS = 10;
  private static readonly MIN_LENGTH = 8;

  private constructor(hash: string) {
    this.hash = hash;
  }

  static async create(plainText: string): Promise<Password> {
    if (plainText.length < Password.MIN_LENGTH) {
      throw new Error(`Password must be at least ${Password.MIN_LENGTH} characters`);
    }
    const hash = await bcrypt.hash(plainText, Password.SALT_ROUNDS);
    return new Password(hash);
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  async compare(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.hash);
  }
}
