export class ProjectName {
  readonly value: string;

  constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error("Project name cannot be empty");
    }
    if (trimmed.length > 100) {
      throw new Error("Project name cannot exceed 100 characters");
    }
    this.value = trimmed;
  }
}
