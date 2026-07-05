import { describe, it, expect } from "vitest";
import { createProjectDtoSchema } from "./create-project-dto.js";

describe("CreateProjectDto", () => {
  it("accepts a valid repositoryUrl", () => {
    const valid = { name: "Test", repoUrl: "https://github.com/org/repo" };
    expect(createProjectDtoSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid repositoryUrl", () => {
    const invalid = { name: "Test", repoUrl: "not-a-url" };
    const result = createProjectDtoSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});