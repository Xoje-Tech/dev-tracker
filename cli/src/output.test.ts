import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { useJson } from "./output.js";

let root: Command;
let sub: Command;

beforeEach(() => {
  vi.restoreAllMocks();
  root = new Command();
  root.option("--url <url>", "API base URL", "http://example.test");
  root.option("--json", "output machine JSON", false);
  // Register a child subcommand so we can simulate the real register*Commands
  // wiring: the child receives its OWN Command instance (its parent is root).
  sub = root.command("child").action(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useJson(program)", () => {
  it("returns true when the root program has --json set and is invoked from a subcommand", () => {
    root.parse(["node", "test", "--json", "child"], { from: "node" });
    expect(useJson(sub)).toBe(true);
  });

  it("returns false when the root program has --json unset and is invoked from a subcommand", () => {
    root.parse(["node", "test", "child"], { from: "node" });
    expect(useJson(sub)).toBe(false);
  });

  it("uses its own opts when the program has no parent (root itself) — no flag set", () => {
    root.parse(["node", "test", "child"], { from: "node" });
    expect(root.parent).toBeNull();
    expect(useJson(root)).toBe(false);
  });

  it("returns true when the program has no parent (root itself) and --json IS set", () => {
    root.parse(["node", "test", "--json", "child"], { from: "node" });
    expect(root.parent).toBeNull();
    expect(useJson(root)).toBe(true);
  });
});
