import { randomBytes } from "node:crypto";

export class ApiKey {
  readonly value: string;

  private static readonly PREFIX = "dk_";
  private static readonly BYTE_LENGTH = 32;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): ApiKey {
    const bytes = randomBytes(ApiKey.BYTE_LENGTH);
    const token = bytes.toString("base64url");
    return new ApiKey(`${ApiKey.PREFIX}${token}`);
  }

  static fromValue(value: string): ApiKey {
    if (!value.startsWith(ApiKey.PREFIX)) {
      throw new Error("Invalid API key format");
    }
    return new ApiKey(value);
  }
}
