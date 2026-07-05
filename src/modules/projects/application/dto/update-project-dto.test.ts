import { describe, it, expect } from "vitest";
import { updateProjectDtoSchema } from "./update-project-dto.js";

describe("UpdateProjectDto", () => {
  it("accepts a valid repositoryUrl", () => {
    const valid = { repoUrl: "https://github.com/org/repo" };
    expect(updateProjectDtoSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid repositoryUrl", () => {
    const invalid = { repoUrl: "not-a-url" };
    const result = updateProjectDtoSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});