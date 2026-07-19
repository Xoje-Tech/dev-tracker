import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import * as sessionMod from "../session.js";
import { mockFetch } from "../../test-helpers.js";
import { registerSprintCommands } from "./sprints.js";

let program: Command;

beforeEach(() => {
  vi.restoreAllMocks();
  program = new Command();
  program
    .name("dt")
    .option("-u, --url <url>", "API base URL", "http://example.test")
    .option("--json", "output JSON", false);
  registerSprintCommands(program);
  program.exitOverride();
  program.configureOutput({ writeOut: () => undefined, writeErr: () => undefined });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const sample = {
  id: "sprint-1",
  projectId: "p1",
  name: "Sprint A",
  description: "first sprint",
  milestoneId: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-02T00:00:00.000Z",
};

describe("dt sprints list", () => {
  it("GETs /api/projects/:projectId/sprints and prints JSON in --json mode", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: [sample] }]);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      ["node", "test", "--json", "sprints", "list", "--project", "p1"],
      { from: "node" },
    );

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify([sample], null, 2));
  });
});

describe("dt sprints get", () => {
  it("GETs /api/projects/:projectId/sprints/:sprintId and prints JSON", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: sample }]);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      ["node", "test", "--json", "sprints", "get", "sprint-1", "--project", "p1"],
      { from: "node" },
    );

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(sample, null, 2));
  });
});

describe("dt sprints create", () => {
  it("POSTs /api/projects/:projectId/sprints with the name", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 201, body: { ...sample, id: "sprint-new" } }]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      [
        "node",
        "test",
        "--json",
        "sprints",
        "create",
        "--project",
        "p1",
        "--name",
        "Sprint A",
      ],
      { from: "node" },
    );

    const fetchCall = mockFetch().spy?.mock.calls.at(-1) ?? [];
    expect(fetchCall[0]).toBe("http://example.test/api/projects/p1/sprints");
    const bodyArg = JSON.parse(fetchCall[1]?.body as string);
    expect(bodyArg).toEqual({ name: "Sprint A" });
  });

  it("passes --milestone-id when provided", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 201, body: { ...sample, milestoneId: "m1" } }]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      [
        "node",
        "test",
        "--json",
        "sprints",
        "create",
        "--project",
        "p1",
        "--name",
        "Sprint A",
        "--milestone-id",
        "m1",
      ],
      { from: "node" },
    );

    const fetchCall = mockFetch().spy?.mock.calls.at(-1) ?? [];
    const bodyArg = JSON.parse(fetchCall[1]?.body as string);
    expect(bodyArg).toEqual({ name: "Sprint A", milestoneId: "m1" });
  });
});

describe("dt sprints update", () => {
  it("PATCHes /api/projects/:projectId/sprints/:sprintId with the new fields", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: { ...sample, name: "Renamed" } }]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      [
        "node",
        "test",
        "--json",
        "sprints",
        "update",
        "sprint-1",
        "--project",
        "p1",
        "--name",
        "Renamed",
      ],
      { from: "node" },
    );

    const fetchCall = mockFetch().spy?.mock.calls.at(-1) ?? [];
    expect(fetchCall[0]).toBe("http://example.test/api/projects/p1/sprints/sprint-1");
    const bodyArg = JSON.parse(fetchCall[1]?.body as string);
    expect(bodyArg).toEqual({ name: "Renamed" });
  });

  it("treats --milestone-id null as detach (sends literal null)", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: { ...sample, milestoneId: null } }]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      [
        "node",
        "test",
        "--json",
        "sprints",
        "update",
        "sprint-1",
        "--project",
        "p1",
        "--milestone-id",
        "null",
      ],
      { from: "node" },
    );

    const fetchCall = mockFetch().spy?.mock.calls.at(-1) ?? [];
    const bodyArg = JSON.parse(fetchCall[1]?.body as string);
    // Detach: explicit null in the PATCH body.
    expect(bodyArg).toEqual({ milestoneId: null });
  });
});

describe("dt sprints delete", () => {
  it("DELETEs /api/projects/:projectId/sprints/:sprintId", async () => {
    vi.spyOn(sessionMod, "loadSession").mockResolvedValue({
      baseUrl: "http://example.test",
      apiKey: "test-key",
    });
    vi.spyOn(sessionMod, "saveSession").mockResolvedValue();
    const { enqueue } = mockFetch();
    enqueue([{ status: 200, body: { success: true } }]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await program.parseAsync(
      ["node", "test", "--json", "sprints", "delete", "sprint-1", "--project", "p1"],
      { from: "node" },
    );

    const fetchCall = mockFetch().spy?.mock.calls.at(-1) ?? [];
    expect(fetchCall[0]).toBe("http://example.test/api/projects/p1/sprints/sprint-1");
    expect((fetchCall[1] as RequestInit).method).toBe("DELETE");
  });
});

describe("dt sprints alias", () => {
  it("registers 'sp' as an alias for 'sprints'", async () => {
    let didError = false;
    try {
      await program.parseAsync(["node", "test", "sp", "--help"], { from: "node" });
    } catch (err) {
      didError = true;
    }
    expect(didError).toBe(true);
  });
});