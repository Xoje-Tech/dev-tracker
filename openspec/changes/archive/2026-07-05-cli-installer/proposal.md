# Proposal: CLI Global Installer

## Intent

To provide a seamless, zero-dependency installation experience for the Dev Tracker CLI. Users should be able to install and run the CLI (`dt`) globally via a simple `curl | bash` command without needing to clone the monorepo, install Node.js, or run `pnpm install`.

## Scope

### In Scope
- Create a cross-platform `install.sh` script to detect OS and architecture.
- Package the CLI into standalone executable binaries using `pkg` (or Node SEA + `esbuild`).
- Automatically configure the user's PATH (modifying `.bashrc`, `.zshrc`, etc.) to include `~/.dev-tracker/bin`.
- Distribute binaries via GitHub Releases or a static endpoint.

### Out of Scope
- Windows native support (`.bat` / `.ps1` installer) in the first iteration.
- Automatic self-update command (`dt update`) - deferred.

## Capabilities

### New Capabilities
- `cli-installer`: Distribution and installation mechanism for the Dev Tracker CLI, including OS/architecture detection and shell path configuration.

### Modified Capabilities
- None

## Approach

1. **Packaging**: Add a build step in `cli/package.json` to bundle `src/index.ts` into standalone executables (e.g., `dt-linux-x64`, `dt-macos-arm64`) to remove the Node.js requirement.
2. **Distribution**: Upload the bundled binaries and `install.sh` as release assets.
3. **Installer Script**: `install.sh` will:
   - Detect OS (`uname -s`) and Architecture (`uname -m`).
   - Download the correct binary into `~/.dev-tracker/bin/dt` and make it executable.
   - Detect the user's shell and append `export PATH="$HOME/.dev-tracker/bin:$PATH"` to the appropriate RC file, ensuring idempotency.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `cli/package.json` | Modified | Add binary packaging scripts. |
| `scripts/install.sh` | New | Bootstrap shell script for curl-to-bash execution. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Shell RC file corruption | Low | Script will only append and must check if the path is already present before writing. |
| Missing dynamic libraries on target OS | Medium | Compile statically or document required glibc/system dependencies. |

## Rollback Plan

Users can uninstall by removing the `~/.dev-tracker` directory and deleting the PATH export line from their shell RC file. No global system directories (`/usr/local/bin`) are modified, eliminating need for root access or system-wide rollbacks.

## Dependencies

- Tools for packaging (e.g., `pkg` or `esbuild`).
- Hosting for the script and binaries (e.g., GitHub Releases).

## Success Criteria

- [ ] `curl -sL <url>/install.sh | bash` successfully installs the CLI.
- [ ] The `dt` command is available in the user's shell PATH.
- [ ] The `dt` command executes correctly without requiring the monorepo or an existing Node.js environment.