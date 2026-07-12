# cli-github-sync Specification

## Purpose

Mirror a subset of GitHub project state (open issues, open PRs, branches, last 20 Actions runs) into a local gitignored cache, and expose explicit single-entity push operations (issue comment/close/reopen, PR comment/review) backed by the `gh` CLI. Brings GitHub workflow surface into the same tool that already drives dev-tracker itself.

## Requirements

### Requirement: gh CLI availability check

The system SHALL verify `gh` is installed and authenticated before any sync or push operation.

#### Scenario: gh is installed and authenticated
- GIVEN `gh` is on PATH and `gh auth status` exits 0
- WHEN the user runs `dt sync pull`
- THEN the command proceeds without prompting

#### Scenario: gh is not installed
- GIVEN `gh` is not on PATH
- WHEN the user runs any sync or issue or pr command
- THEN the system exits with a non-zero code and prints the install URL https://cli.github.com

#### Scenario: gh token is expired
- GIVEN `gh` is installed but `gh auth status` reports an expired token
- WHEN the user runs `dt sync pull`
- THEN the system exits non-zero AND prints the renew hint referencing `~/.hermes/skills/github/gh-app-token-renew/assets/renew-gh-token.sh`

### Requirement: Issue mirror

The system SHALL mirror each open issue to a JSON file under the local sync cache.

#### Scenario: Pull populates open issues
- GIVEN the repo has 3 open issues
- WHEN the user runs `dt sync pull`
- THEN one JSON file per open issue is written, containing title, body, state, labels, author, assignees, the last 30 comments oldest→newest, createdAt, updatedAt, closedAt, url

#### Scenario: Closed issues are not pulled
- GIVEN the repo has 1 open and 1 closed issue
- WHEN the user runs `dt sync pull`
- THEN the closed issue is NOT mirrored

#### Scenario: Comments are truncated
- GIVEN an issue has 100 comments
- WHEN the system writes its mirror file
- THEN the `comments` array contains exactly the last 30 comments, ordered oldest→newest

### Requirement: PR mirror

The system SHALL mirror each open PR to a JSON file under the local sync cache.

#### Scenario: Pull populates open PRs
- GIVEN the repo has 2 open PRs
- WHEN the user runs `dt sync pull`
- THEN one JSON file per open PR is written containing title, body, state, headRef, baseRef, mergeable, reviewDecision, statusCheckRollup, labels, author, the last 30 comments, reviews, createdAt, updatedAt, url

#### Scenario: PR reviews are included
- GIVEN a PR has 3 reviews (approve, request-changes, comment)
- WHEN the system writes its mirror file
- THEN the `reviews` array contains all 3 review objects with author, state, body, submittedAt

### Requirement: Branch mirror

The system SHALL write separate local and remote branch lists.

#### Scenario: Local branches listed
- GIVEN the working tree has 3 local branches
- WHEN the user runs `dt sync pull`
- THEN the local branch list contains all 3 entries with name, lastCommitSha, lastCommitSubject

#### Scenario: Remote branches listed
- GIVEN `origin` has 12 remote-tracking branches
- WHEN the user runs `dt sync pull`
- THEN the remote branch list contains all 12 entries

### Requirement: Actions runs mirror

The system SHALL mirror the last 20 GitHub Actions runs.

#### Scenario: Pull fetches last 20 runs
- GIVEN the repo has 35 Actions runs
- WHEN the user runs `dt sync pull`
- THEN exactly 20 mirror files exist with name, status, conclusion, headBranch, event, url, createdAt

### Requirement: Filtered sync

The system SHALL support syncing only one entity type at a time.

#### Scenario: Sync only issues
- GIVEN a PR mirror file already exists
- WHEN the user runs `dt sync issues`
- THEN the issue mirror is refreshed AND the PR mirror file mtime is unchanged

### Requirement: Cache status

The system SHALL report cache age per entity type.

#### Scenario: Fresh cache
- GIVEN a mirror file was written 2 hours ago
- WHEN the user runs `dt sync status`
- THEN the output shows that entity as `2h ago (ok)`

#### Scenario: Stale cache warning
- GIVEN a mirror file was written 30 hours ago
- WHEN the user runs `dt sync status`
- THEN the output marks that entity `(stale)` AND exits with a non-zero warning code

### Requirement: Issue push operations

The system SHALL support commenting, closing, and reopening individual issues, refreshing the affected mirror after each.

#### Scenario: Comment is posted
- GIVEN an issue exists in cache and remote
- WHEN the user runs `dt issue <n> comment --body "Looks good"`
- THEN the comment is posted AND the issue mirror is refreshed within 2 seconds

#### Scenario: Close transitions state
- GIVEN an issue is OPEN in cache
- WHEN the user runs `dt issue <n> close`
- THEN the issue is closed AND the refreshed mirror shows `state: "CLOSED"`

### Requirement: PR push operations

The system SHALL support commenting on a PR and posting reviews (approve, request-changes, comment), refreshing the affected mirror after each.

#### Scenario: Approve review
- GIVEN a PR exists
- WHEN the user runs `dt pr <n> review --approve --body "LGTM"`
- THEN the approve review is posted AND the PR mirror is refreshed

#### Scenario: Request changes review
- GIVEN a PR exists
- WHEN the user runs `dt pr <n> review --request-changes --body "Needs fix"`
- THEN the request-changes review is posted AND the PR mirror is refreshed

### Requirement: JSON output mode

All new commands SHALL respect the root `--json` flag.

#### Scenario: Human mode
- GIVEN `--json` is NOT set
- WHEN the user runs `dt sync status`
- THEN the output is a human-readable table

#### Scenario: Machine mode
- GIVEN `--json` IS set
- WHEN the user runs `dt sync status`
- THEN the output is valid JSON mapping each entity type to its last_pulled_at, age_hours, stale flag

### Requirement: Local cache is gitignored

The local sync cache directory SHALL be in `.gitignore` AND a unit test SHALL assert it.

#### Scenario: Path is ignored
- GIVEN the test suite runs
- WHEN the cache-ignored assertion executes
- THEN `git check-ignore <cache-path>` exits 0
