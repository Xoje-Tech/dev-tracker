export class SprintName {
  readonly value: string;

  constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error("Sprint name cannot be empty");
    }
    if (trimmed.length > 120) {
      throw new Error("Sprint name cannot exceed 120 characters");
    }
    this.value = trimmed;
  }
}
