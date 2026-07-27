# Tasks: cli-installer

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Packaging Configuration

- [x] 1.1 Modify `cli/package.json` to add `pkg` devDependency and `"bin"` field.
- [x] 1.2 Modify `cli/package.json` to add `"pkg"` configuration for targets (node18-linux-x64, node18-macos-x64, node18-macos-arm64).
- [x] 1.3 Modify `cli/package.json` to add a `"package"` script for running `pkg`.

## Phase 2: Installation Script

- [x] 2.1 Create `scripts/install.sh` with OS and architecture detection.
- [x] 2.2 Add download logic in `scripts/install.sh` fetching from `https://github.com/xoje-tech/dev-tracker/releases/latest/download/dt-{os}-{arch}`.
- [x] 2.3 Add idempotent PATH injection logic to `scripts/install.sh` for `.bashrc` and `.zshrc` targeting `~/.dev-tracker/bin`.

## Phase 3: Testing / Verification

- [x] 3.1 Create a verification script `scripts/test-install.sh` to test `install.sh` against a dummy RC file without affecting the host environment.
- [x] 3.2 Add container-based test instructions for E2E verification of the standalone binary.