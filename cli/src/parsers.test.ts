import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  parseBranchList,
  parseIssue,
  parsePr,
  parseRun,
} from "./parsers.js";

/* ───────────────────────── helpers ───────────────────────── */

const baseIssue = {
  number: 10,
  title: "Bug in login",
  body: "Cannot log in with valid credentials",
  state: "OPEN",
  labels: [{ name: "bug" }, { name: "P0" }],
  author: { login: "alice" },
  assignees: [{ login: "bob" }],
  comments: [
    {
      author: { login: "carol" },
      body: "I can repro",
      createdAt: "2025-01-01T10:00:00Z",
    },
    {
      author: { login: "dave" },
      body: "Same here",
      createdAt: "2025-01-02T10:00:00Z",
    },
  ],
  createdAt: "2025-01-01T09:00:00Z",
  updatedAt: "2025-01-03T09:00:00Z",
  closedAt: null,
  url: "https://github.com/Xoje-Tech/dev-tracker/issues/10",
};

const basePrExtras = () => ({
  headRefName: "feat/login-fix",
  baseRefName: "develop",
  mergeable: "MERGEABLE",
  reviewDecision: "APPROVED",
  statusCheckRollup: [{ name: "ci", conclusion: "success" }],
  reviews: [
    {
      author: { login: "reviewer-1" },
      state: "APPROVED",
      body: "LGTM",
      submittedAt: "2025-01-04T12:00:00Z",
    },
  ],
});

beforeEach(() => {
  // No fixtures are needed; keep a hook so future fakes can attach state.
});

afterEach(() => {
  // No fixtures to clean up.
});

/* ───────────────────────── parseIssue ───────────────────────── */

describe("parseIssue — happy paths", () => {
  it("returns a typed IssuePayload for a complete issue object", () => {
    const parsed = parseIssue(baseIssue);
    expect(parsed.number).toBe(10);
    expect(parsed.title).toBe("Bug in login");
    expect(parsed.body).toBe("Cannot log in with valid credentials");
    expect(parsed.state).toBe("OPEN");
    expect(parsed.labels).toEqual([{ name: "bug" }, { name: "P0" }]);
    expect(parsed.author).toEqual({ login: "alice" });
    expect(parsed.assignees).toEqual([{ login: "bob" }]);
    expect(parsed.comments).toEqual(baseIssue.comments);
    expect(parsed.createdAt).toBe(baseIssue.createdAt);
    expect(parsed.updatedAt).toBe(baseIssue.updatedAt);
    expect(parsed.closedAt).toBeNull();
    expect(parsed.url).toBe(baseIssue.url);
  });

  it("preserves an empty comments array (the real input shape GH returns for uncommented issues)", () => {
    const parsed = parseIssue({ ...baseIssue, comments: [] });
    expect(parsed.comments).toEqual([]);
  });

  it("tolerates null body and null closedAt as the absence of a value, not as a type error", () => {
    const parsed = parseIssue({
      ...baseIssue,
      body: null,
      closedAt: null,
    });
    expect(parsed.body).toBeNull();
    expect(parsed.closedAt).toBeNull();
  });

  it("accepts state === 'CLOSED'", () => {
    const parsed = parseIssue({
      ...baseIssue,
      state: "CLOSED",
      closedAt: "2025-01-05T00:00:00Z",
    });
    expect(parsed.state).toBe("CLOSED");
    expect(parsed.closedAt).toBe("2025-01-05T00:00:00Z");
  });
});

describe("parseIssue — failure paths", () => {
  it("throws a descriptive error when 'number' is missing", () => {
    const { number: _omit, ...rest } = baseIssue;
    expect(() => parseIssue(rest)).toThrow(/parsers: issue\.number/);
  });

  it("throws when 'title' is not a string", () => {
    expect(() => parseIssue({ ...baseIssue, title: 123 })).toThrow(
      /issue\.title/,
    );
  });

  it("throws when 'state' is not OPEN or CLOSED", () => {
    expect(() => parseIssue({ ...baseIssue, state: "IN_PROGRESS" })).toThrow(
      /issue\.state/,
    );
  });

  it("throws when 'labels' is not an array", () => {
    expect(() => parseIssue({ ...baseIssue, labels: "not-an-array" })).toThrow(
      /issue\.labels/,
    );
  });

  it("throws when a comment is missing its body", () => {
    const badComment = {
      author: { login: "carol" },
      createdAt: "2025-01-01T10:00:00Z",
      body: undefined,
    };
    expect(() =>
      parseIssue({ ...baseIssue, comments: [badComment] }),
    ).toThrow(/comments\[0\]\.body/);
  });

  it("throws on null input (not an object)", () => {
    expect(() => parseIssue(null)).toThrow(/parsers: issue/);
  });

  it("throws on primitive input (number)", () => {
    expect(() => parseIssue(42)).toThrow(/parsers: issue/);
  });
});

/* ───────────────────────── parsePr ───────────────────────── */

describe("parsePr — extends parseIssue and adds PR-specific fields", () => {
  it("parses a complete PR payload", () => {
    const parsed = parsePr({ ...baseIssue, ...basePrExtras() });
    expect(parsed.number).toBe(10);
    expect(parsed.state).toBe("OPEN");
    expect(parsed.headRefName).toBe("feat/login-fix");
    expect(parsed.baseRefName).toBe("develop");
    expect(parsed.mergeable).toBe("MERGEABLE");
    expect(parsed.reviewDecision).toBe("APPROVED");
    expect(parsed.statusCheckRollup).toEqual([
      { name: "ci", conclusion: "success" },
    ]);
    expect(parsed.reviews).toEqual(basePrExtras().reviews);
    expect(parsed.reviews[0]!.author.login).toBe("reviewer-1");
  });

  it("accepts reviewDecision === null (no reviews yet)", () => {
    const extras = basePrExtras();
    const parsed = parsePr({
      ...baseIssue,
      ...extras,
      reviewDecision: null,
    });
    expect(parsed.reviewDecision).toBeNull();
  });

  it("accepts an empty reviews array", () => {
    const extras = basePrExtras();
    const parsed = parsePr({
      ...baseIssue,
      ...extras,
      reviews: [],
    });
    expect(parsed.reviews).toEqual([]);
  });

  it("throws when 'reviews' is missing entirely", () => {
    const { reviews: _omit, ...rest } = basePrExtras();
    expect(() => parsePr({ ...baseIssue, ...rest })).toThrow(/pr\.reviews/);
  });

  it("throws when a review has an unknown 'state' literal", () => {
    const badReview = {
      ...basePrExtras().reviews[0],
      state: "PENDING_REVIEW_NOT_REAL",
    };
    expect(() =>
      parsePr({
        ...baseIssue,
        ...basePrExtras(),
        reviews: [badReview],
      }),
    ).toThrow(/reviews\[0\]\.state/);
  });

  it("throws when mergeable is not one of MERGEABLE|CONFLICTING|UNKNOWN", () => {
    expect(() =>
      parsePr({ ...baseIssue, ...basePrExtras(), mergeable: "MAYBE" }),
    ).toThrow(/pr\.mergeable/);
  });
});

/* ───────────────────────── parseRun ───────────────────────── */

const baseRun = {
  databaseId: 987654,
  name: "CI",
  status: "completed",
  conclusion: "success",
  headBranch: "feat/x",
  event: "push",
  url: "https://github.com/Xoje-Tech/dev-tracker/actions/runs/987654",
  createdAt: "2025-01-05T10:00:00Z",
};

describe("parseRun", () => {
  it("parses a complete run payload", () => {
    const parsed = parseRun(baseRun);
    expect(parsed.databaseId).toBe(987654);
    expect(parsed.status).toBe("completed");
    expect(parsed.conclusion).toBe("success");
    expect(parsed.headBranch).toBe("feat/x");
  });

  it("accepts conclusion === null for in-progress runs", () => {
    const parsed = parseRun({ ...baseRun, conclusion: null });
    expect(parsed.conclusion).toBeNull();
  });

  it("throws when 'status' is not a known run status", () => {
    expect(() => parseRun({ ...baseRun, status: "frobbed" })).toThrow(
      /runs?\.status|run\.status/,
    );
  });

  it("throws when databaseId is missing", () => {
    const { databaseId: _omit, ...rest } = baseRun;
    expect(() => parseRun(rest)).toThrow(/(runs?\.databaseId|run\.databaseId)/);
  });
});

/* ───────────────────────── parseBranchList ───────────────────────── */

describe("parseBranchList", () => {
  it("parses a list of branches with last commit sha+subject", () => {
    const branches = [
      {
        name: "main",
        lastCommit: { sha: "abc123", subject: "initial commit" },
      },
      {
        name: "feat/x",
        lastCommit: { sha: "def456", subject: "wip: work on x" },
      },
    ];
    const parsed = parseBranchList(branches);
    expect(parsed).toEqual([
      { name: "main", lastCommitSha: "abc123", lastCommitSubject: "initial commit" },
      { name: "feat/x", lastCommitSha: "def456", lastCommitSubject: "wip: work on x" },
    ]);
  });

  it("returns an empty array on an empty input list", () => {
    expect(parseBranchList([])).toEqual([]);
  });

  it("throws when 'lastCommit.sha' is missing", () => {
    expect(() =>
      parseBranchList([{ name: "main", lastCommit: { subject: "init" } }]),
    ).toThrow(/branches\[0\]\.lastCommit\.sha/);
  });

  it("throws when input is not an array", () => {
    expect(() => parseBranchList("not-an-array")).toThrow(/parsers: branches/);
  });
});

/* unused — silence unused-import lint when tmp file pattern is later needed */
void mkdtempSync;
void tmpdir;
void join;
void rmSync;
void randomUUID;
