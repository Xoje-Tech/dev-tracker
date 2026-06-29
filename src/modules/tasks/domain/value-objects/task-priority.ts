const VALID_PRIORITIES = ["none", "low", "medium", "high", "urgent"] as const;

export class TaskPriority {
  readonly value: string;

  constructor(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === "") {
      this.value = "none";
      return;
    }

    const normalized = String(value).toLowerCase().trim();
    if (!(VALID_PRIORITIES as readonly string[]).includes(normalized)) {
      throw new Error(
        `Invalid priority: "${value}". Must be one of: ${VALID_PRIORITIES.join(", ")}`,
      );
    }
    this.value = normalized;
  }

  static readonly NONE = "none";
  static readonly LOW = "low";
  static readonly MEDIUM = "medium";
  static readonly HIGH = "high";
  static readonly URGENT = "urgent";
}
