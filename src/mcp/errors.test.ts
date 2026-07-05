import { describe, it, expect } from "vitest";
import { formatMcpError, formatZodError } from "./errors";
import { ZodError, ZodIssue } from "zod";

describe("formatMcpError", () => {
  it("formats standard string errors as isError: true", () => {
    const result = formatMcpError("Invalid column ID");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid column ID");
  });

  it("handles empty error messages safely", () => {
    const result = formatMcpError("");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unknown error occurred");
  });

  it("handles HTTP error status codes", () => {
    const result = formatMcpError("Not Found", 404);
    expect(result.content[0].text).toContain("HTTP 404: Not Found");
  });
});

describe("formatZodError", () => {
  it("formats Zod validation errors with field details", () => {
    const error = new ZodError([
      { path: ["projectId"], message: "Required" } as ZodIssue,
      { path: ["name"], message: "String must contain at least 1 character(s)" } as ZodIssue
    ]);
    const result = formatZodError(error);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Validation failed");
    expect(result.content[0].text).toContain("projectId: Required");
    expect(result.content[0].text).toContain("name: String must contain");
  });
});
