export class TagName {
  readonly value: string;

  constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error("Tag name cannot be empty");
    }
    if (trimmed.length > 50) {
      throw new Error("Tag name cannot exceed 50 characters");
    }
    this.value = trimmed.toLowerCase();
  }
}
