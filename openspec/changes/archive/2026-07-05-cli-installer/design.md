# Design: CLI Global Installer

## Technical Approach

The CLI installer mechanism consists of two parts:
1. **Packaging**: Bundling the Node.js CLI into standalone executables using `pkg`. This bundles the V8 engine, standard library, and our code into a single binary, removing the need for the user to install Node.js.
2. **Installation Script**: A bash script (`scripts/install.sh`) meant to be run via `curl | bash`. It detects the OS/Arch, downloads the corresponding binary into a scoped user directory (`~/.dev-tracker/bin/`), and modifies the shell RC file to put it on the PATH.

This maps directly to the proposal and satisfies all requirements in `spec.md` without requiring system-wide permissions (sudo).

## Architecture Decisions

### Decision: Binary Bundler

**Choice**: Use `pkg` (Vercel) to compile the Node.js CLI into a standalone executable.
**Alternatives considered**: Node.js Single Executable Applications (SEA) + `esbuild`, or just distributing the raw JS and requiring users to install Node.
**Rationale**: Node SEA is still evolving and requires a complex multi-step build process (compile script, inject blob, etc.). Requiring Node defeats the zero-dependency goal. `pkg` is battle-tested, handles dynamic imports better, and provides a simple 1-line build command for Linux and macOS targets.

### Decision: Installation Target Directory

**Choice**: `~/.dev-tracker/bin/dt`
**Alternatives considered**: `/usr/local/bin/dt`, `~/.local/bin/dt`
**Rationale**: Modifying `/usr/local/bin` requires `sudo`, which is a security risk and terrible DX for a curl-to-bash script. `~/.local/bin` is standard on Linux but less common on macOS. A dedicated dot-folder (`~/.dev-tracker`) guarantees we don't clobber other tools, makes uninstallation trivial (just `rm -rf`), and matches patterns used by tools like `bun`, `nvm`, and `rustup`.

### Decision: Shell Configuration

**Choice**: Idempotent append to `.bashrc` or `.zshrc`.
**Alternatives considered**: Requiring the user to manually add it.
**Rationale**: Automated PATH injection is standard for modern dev tools. Idempotency (checking `grep -q '.dev-tracker/bin'` before appending) mitigates the risk of RC file corruption.

## Data Flow

    Developer Env        GitHub Releases       User Env
         │                     │                  │
    [pnpm build]               │                  │
         │                     │                  │
    [pnpm pkg] ──(binaries)──→ │                  │
                               │ ←(install.sh)── [curl | bash]
                               │                  │
                               └───────────────→ [~/.dev-tracker/bin/dt]
                                                  │
                                                 [RC file updated]

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `cli/package.json` | Modify | Add `pkg` to devDependencies and a `package` script. Define `"bin"` and `"pkg"` targets (node18-linux-x64, node18-macos-x64, node18-macos-arm64). |
| `scripts/install.sh` | Create | Bash script to detect OS/Arch, download from GitHub, place binary, and update PATH idempotently. |

## Interfaces / Contracts

**Installer URL Contract**:
The `install.sh` script assumes binaries are hosted at a predictable URL pattern.
Format: `https://github.com/xoje-tech/dev-tracker/releases/latest/download/dt-{os}-{arch}`
Where:
- `{os}` is `linux` or `macos`
- `{arch}` is `x64` or `arm64`

**Install Script Usage**:
```bash
curl -sL https://raw.githubusercontent.com/xoje-tech/dev-tracker/master/scripts/install.sh | bash
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Build process | Run `pnpm pkg` locally, verify binaries are generated in output dir. |
| Integration | Install script logic | Create a dummy RC file, run `install.sh`, verify `~/.dev-tracker/bin/dt` exists and RC file is modified exactly once. |
| E2E | Standalone execution | Move the built binary to a clean container (no Node installed) and run `./dt --help`. |

## Migration / Rollout

No migration required. Existing developers can continue using `pnpm run start` in the CLI directory.

## Open Questions

- [ ] Will we use GitHub Releases or an S3 bucket to host the binaries? (Assuming GitHub Releases for now).