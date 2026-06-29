export class TaskTitle {
  readonly value: string;

  constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error("Task title cannot be empty");
    }
    if (trimmed.length > 200) {
      throw new Error("Task title cannot exceed 200 characters");
    }
    this.value = trimmed;
  }
}
