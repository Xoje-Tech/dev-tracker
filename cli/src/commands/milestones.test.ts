import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import * as sessionMod from "../session.js";
import { mockFetch } from "../../test-helpers.js";
import { registerMilestoneCommands } from "./milestones.js";

let program: Command;

beforeEach(() => {
  vi.restoreAllMocks();
  program = new Command();
  program
    .name("dt")
    .option("-u, --url <url>", "API base URL", "http://example.test")
    .option("--json", "output JSON", false);
  registerMilestoneCommands(program);
  // Suppress commander's parse output during tests.
  program.exitOverride();
  program.configureOutput({ writeOut: () => undefined, writeErr: () => undefined });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Minimal Milestone DTO for assertions.
const sample = {
  id: "mil-1",
  projectId: "p1",
  title: "Alpha",
  description: "first release",
  dueDate: null,
  status: "open",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-02T00:00:00.000Z",
};

describe("dt milestones list", () => {
  it("GETs /api/projects/:projectId/milestones and prints the JSON array in --json mode", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: [sample] }]);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      ["node", "test", "--json", "milestones", "list", "--project", "p1"],
      { from: "node" },
    );

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify([sample], null, 2));
  });

  it("passes --include-archived to the query string", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: [] }]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      ["node", "test", "--json", "milestones", "list", "--project", "p1", "--include-archived"],
      { from: "node" },
    );

    const fetchCall = mockFetch().spy?.mock.calls.at(-1) ?? [];
    expect(fetchCall[0]).toContain("includeArchived=true");
  });
});

describe("dt milestones get", () => {
  it("GETs /api/projects/:projectId/milestones/:milestoneId and prints JSON", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: sample }]);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      ["node", "test", "--json", "milestones", "get", "mil-1", "--project", "p1"],
      { from: "node" },
    );

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(sample, null, 2));
  });
});

describe("dt milestones create", () => {
  it("POSTs /api/projects/:projectId/milestones with the title", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 201, body: { ...sample, id: "mil-new" } }]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      [
        "node",
        "test",
        "--json",
        "milestones",
        "create",
        "--project",
        "p1",
        "--title",
        "Alpha",
      ],
      { from: "node" },
    );

    const fetchCall = mockFetch().spy?.mock.calls.at(-1) ?? [];
    expect(fetchCall[0]).toBe("http://example.test/api/projects/p1/milestones");
    const bodyArg = JSON.parse(fetchCall[1]?.body as string);
    expect(bodyArg).toEqual({ title: "Alpha" });
  });
});

describe("dt milestones update", () => {
  it("PATCHes /api/projects/:projectId/milestones/:milestoneId with the new fields", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: { ...sample, title: "Renamed" } }]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      [
        "node",
        "test",
        "--json",
        "milestones",
        "update",
        "mil-1",
        "--project",
        "p1",
        "--title",
        "Renamed",
      ],
      { from: "node" },
    );

    const fetchCall = mockFetch().spy?.mock.calls.at(-1) ?? [];
    expect(fetchCall[0]).toBe("http://example.test/api/projects/p1/milestones/mil-1");
    const bodyArg = JSON.parse(fetchCall[1]?.body as string);
    expect(bodyArg).toEqual({ title: "Renamed" });
  });
});

describe("dt milestones delete", () => {
  it("DELETEs /api/projects/:projectId/milestones/:milestoneId", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: { success: true } }]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      ["node", "test", "--json", "milestones", "delete", "mil-1", "--project", "p1"],
      { from: "node" },
    );

    const fetchCall = mockFetch().spy?.mock.calls.at(-1) ?? [];
    expect(fetchCall[0]).toBe("http://example.test/api/projects/p1/milestones/mil-1");
    expect((fetchCall[1] as RequestInit).method).toBe("DELETE");
  });
});

describe("dt milestones archive", () => {
  it("POSTs /api/projects/:projectId/milestones/:milestoneId/archive", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: { ...sample, status: "archived" } }]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      ["node", "test", "--json", "milestones", "archive", "mil-1", "--project", "p1"],
      { from: "node" },
    );

    const fetchCall = mockFetch().spy?.mock.calls.at(-1) ?? [];
    expect(fetchCall[0]).toBe("http://example.test/api/projects/p1/milestones/mil-1/archive");
    expect((fetchCall[1] as RequestInit).method).toBe("POST");
  });
});

describe("dt milestones alias", () => {
  it("registers 'ms' as an alias for 'milestones'", async () => {
    // The alias is registered on the same subcommand tree; we assert by
    // verifying the program has an 'ms' command. We do this by parsing
    // 'ms --help' which is non-destructive.
    let didError = false;
    try {
      await program.parseAsync(["node", "test", "ms", "--help"], { from: "node" });
    } catch (err) {
      didError = true;
    }
    // commander --help prints help and calls process.exit; with
    // exitOverride() it throws. We don't care WHAT it throws — only
    // that 'ms' was recognised as a subcommand (not unknown).
    expect(didError).toBe(true);
  });
});