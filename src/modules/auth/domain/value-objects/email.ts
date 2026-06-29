export class InvalidEmailError extends Error {
  constructor(value: string) {
    super(`Invalid email format: "${value}"`);
    this.name = "InvalidEmailError";
  }
}

export class Email {
  readonly value: string;

  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (!Email.EMAIL_REGEX.test(trimmed)) {
      throw new InvalidEmailError(value);
    }
    this.value = trimmed;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
