/**
 * Hand-rolled type-guard parsers for shapes returned by the `gh ... --json`
 * family of commands. We avoid pulling in zod because cli/package.json has
 * no zod dep and adding it would expand the dependency surface for ~10
 * type assertions each.
 *
 * Every parser throws ParseError on shape mismatch so the caller can
 * surface a structured error (kind="parse") instead of an opaque TypeError.
 */

export interface IssueComment {
  author: { login: string };
  body: string;
  createdAt: string;
}

export interface IssueLabel {
  name: string;
}

export interface IssueAssignee {
  login: string;
}

export interface IssuePayload {
  number: number;
  title: string;
  body: string | null;
  state: "OPEN" | "CLOSED";
  labels: IssueLabel[];
  author: { login: string };
  assignees: IssueAssignee[];
  comments: IssueComment[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  url: string;
}

export type PrReviewState =
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "COMMENTED"
  | "PENDING"
  | "DISMISSED";

export interface PrReview {
  author: { login: string };
  state: PrReviewState;
  body: string;
  submittedAt: string;
}

export type PrMergeableState = "MERGEABLE" | "CONFLICTING" | "UNKNOWN";
export type PrReviewDecision =
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "REVIEW_REQUIRED";

export interface PrPayload extends IssuePayload {
  headRefName: string;
  baseRefName: string;
  mergeable: PrMergeableState;
  reviewDecision: PrReviewDecision | null;
  statusCheckRollup: unknown[] | null;
  reviews: PrReview[];
}

export type RunStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "waiting"
  | "requested";

export type RunConclusion =
  | "success"
  | "failure"
  | "cancelled"
  | "skipped"
  | "timed_out"
  | "action_required"
  | "neutral"
  | "stale"
  | "startup_failure";

export interface RunPayload {
  databaseId: number;
  name: string;
  status: RunStatus;
  conclusion: RunConclusion | null;
  headBranch: string;
  event: string;
  url: string;
  createdAt: string;
}

export interface BranchRef {
  name: string;
  lastCommitSha: string;
  lastCommitSubject: string;
}

/* ───────────────────────── internal helpers ───────────────────────── */

export class ParseError extends Error {
  constructor(
    public readonly path: string,
    public readonly expected: string,
    public readonly got: unknown,
  ) {
    super(`parsers: ${path}: expected ${expected}, got ${JSON.stringify(got)}`);
    this.name = "ParseError";
  }
}

function expectString(raw: unknown, path: string): string {
  if (typeof raw !== "string") throw new ParseError(path, "string", raw);
  return raw;
}

function expectNumber(raw: unknown, path: string): number {
  if (typeof raw !== "number") throw new ParseError(path, "number", raw);
  return raw;
}

function expectObject(raw: unknown, path: string): Record<string, unknown> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ParseError(path, "object", raw);
  }
  return raw as Record<string, unknown>;
}

function expectArray(raw: unknown, path: string): unknown[] {
  if (!Array.isArray(raw)) throw new ParseError(path, "array", raw);
  return raw;
}

function expectLiteral<T extends string>(
  raw: unknown,
  path: string,
  options: readonly T[],
): T {
  if (typeof raw !== "string" || !(options as readonly string[]).includes(raw)) {
    throw new ParseError(path, `one of ${options.join("|")}`, raw);
  }
  return raw as T;
}

const ISSUE_STATES = ["OPEN", "CLOSED"] as const;
const MERGEABLE_STATES = ["MERGEABLE", "CONFLICTING", "UNKNOWN"] as const;
const REVIEW_DECISIONS = [
  "APPROVED",
  "CHANGES_REQUESTED",
  "REVIEW_REQUIRED",
] as const;
const REVIEW_STATES = [
  "APPROVED",
  "CHANGES_REQUESTED",
  "COMMENTED",
  "PENDING",
  "DISMISSED",
] as const;
const RUN_STATUSES = [
  "queued",
  "in_progress",
  "completed",
  "waiting",
  "requested",
] as const;
const RUN_CONCLUSIONS = [
  "success",
  "failure",
  "cancelled",
  "skipped",
  "timed_out",
  "action_required",
  "neutral",
  "stale",
  "startup_failure",
] as const;

/* ───────────────────────── public parsers ───────────────────────── */

export function parseIssue(raw: unknown): IssuePayload {
  const r = expectObject(raw, "issue");
  const number = expectNumber(r.number, "issue.number");
  const title = expectString(r.title, "issue.title");
  const body = r.body === null ? null : expectString(r.body, "issue.body");
  const state = expectLiteral(r.state, "issue.state", ISSUE_STATES);
  const labels = expectArray(r.labels, "issue.labels").map((l, i) => {
    const lo = expectObject(l, `issue.labels[${i}]`);
    return { name: expectString(lo.name, `issue.labels[${i}].name`) };
  });
  const authorObj = expectObject(r.author, "issue.author");
  const author = {
    login: expectString(authorObj.login, "issue.author.login"),
  };
  const assignees = expectArray(r.assignees, "issue.assignees").map((a, i) => {
    const ao = expectObject(a, `issue.assignees[${i}]`);
    return {
      login: expectString(ao.login, `issue.assignees[${i}].login`),
    };
  });
  const comments = expectArray(r.comments, "issue.comments").map((c, i) => {
    const co = expectObject(c, `issue.comments[${i}]`);
    const a = expectObject(co.author, `issue.comments[${i}].author`);
    return {
      author: {
        login: expectString(a.login, `issue.comments[${i}].author.login`),
      },
      body: expectString(co.body, `issue.comments[${i}].body`),
      createdAt: expectString(co.createdAt, `issue.comments[${i}].createdAt`),
    };
  });
  const createdAt = expectString(r.createdAt, "issue.createdAt");
  const updatedAt = expectString(r.updatedAt, "issue.updatedAt");
  const closedAt =
    r.closedAt === null ? null : expectString(r.closedAt, "issue.closedAt");
  const url = expectString(r.url, "issue.url");
  return {
    number,
    title,
    body,
    state,
    labels,
    author,
    assignees,
    comments,
    createdAt,
    updatedAt,
    closedAt,
    url,
  };
}

export function parsePr(raw: unknown): PrPayload {
  const issue = parseIssue(raw);
  const r = expectObject(raw, "pr");
  const headRefName = expectString(r.headRefName, "pr.headRefName");
  const baseRefName = expectString(r.baseRefName, "pr.baseRefName");
  const mergeable = expectLiteral(r.mergeable, "pr.mergeable", MERGEABLE_STATES);
  const reviewDecision =
    r.reviewDecision === null
      ? null
      : expectLiteral(r.reviewDecision, "pr.reviewDecision", REVIEW_DECISIONS);
  const statusCheckRollup =
    r.statusCheckRollup === null
      ? null
      : expectArray(r.statusCheckRollup, "pr.statusCheckRollup");
  const reviews = expectArray(r.reviews, "pr.reviews").map((rv, i) => {
    const rvo = expectObject(rv, `pr.reviews[${i}]`);
    const a = expectObject(rvo.author, `pr.reviews[${i}].author`);
    return {
      author: {
        login: expectString(a.login, `pr.reviews[${i}].author.login`),
      },
      state: expectLiteral(
        rvo.state,
        `pr.reviews[${i}].state`,
        REVIEW_STATES,
      ),
      body: expectString(rvo.body, `pr.reviews[${i}].body`),
      submittedAt: expectString(rvo.submittedAt, `pr.reviews[${i}].submittedAt`),
    };
  });
  return {
    ...issue,
    headRefName,
    baseRefName,
    mergeable,
    reviewDecision,
    statusCheckRollup,
    reviews,
  };
}

export function parseRun(raw: unknown): RunPayload {
  const r = expectObject(raw, "run");
  return {
    databaseId: expectNumber(r.databaseId, "run.databaseId"),
    name: expectString(r.name, "run.name"),
    status: expectLiteral(r.status, "run.status", RUN_STATUSES),
    conclusion:
      r.conclusion === null
        ? null
        : expectLiteral(r.conclusion, "run.conclusion", RUN_CONCLUSIONS),
    headBranch: expectString(r.headBranch, "run.headBranch"),
    event: expectString(r.event, "run.event"),
    url: expectString(r.url, "run.url"),
    createdAt: expectString(r.createdAt, "run.createdAt"),
  };
}

export function parseBranchList(raw: unknown): BranchRef[] {
  return expectArray(raw, "branches").map((b, i) => {
    const bo = expectObject(b, `branches[${i}]`);
    const lc = expectObject(bo.lastCommit, `branches[${i}].lastCommit`);
    return {
      name: expectString(bo.name, `branches[${i}].name`),
      lastCommitSha: expectString(
        lc.sha,
        `branches[${i}].lastCommit.sha`,
      ),
      lastCommitSubject: expectString(
        lc.subject,
        `branches[${i}].lastCommit.subject`,
      ),
    };
  });
}
