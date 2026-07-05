# CLI Installer Specification

## Purpose

Distribution and installation mechanism for the Dev Tracker CLI (`dt`), allowing users to install and run the CLI globally via a simple `curl | bash` command without needing to clone the monorepo, install Node.js, or run `pnpm install`.

## Requirements

### Requirement: Binary Packaging

The system MUST bundle the `dt` CLI into standalone executable binaries for major operating systems and architectures, removing the dependency on an existing Node.js environment.

#### Scenario: Build standalone executable
- GIVEN a Node.js CLI source code
- WHEN the packaging script is run
- THEN it produces standalone executables (e.g., Linux x64, macOS arm64)
- AND these executables run without a local Node.js installation

### Requirement: Installation Script

The system MUST provide an `install.sh` script that automates the downloading and configuration of the Dev Tracker CLI.

#### Scenario: OS and Architecture detection
- GIVEN the installer script is executed on a supported system
- WHEN it determines the host platform
- THEN it identifies the correct OS (`uname -s`) and architecture (`uname -m`)
- AND it downloads the corresponding binary

#### Scenario: Binary placement
- GIVEN the correct binary has been downloaded
- WHEN the script places the binary
- THEN it MUST place the executable in `~/.dev-tracker/bin/dt`
- AND it MUST ensure the file has execution permissions (`chmod +x`)

#### Scenario: Path configuration
- GIVEN the binary is placed in `~/.dev-tracker/bin/dt`
- WHEN the script configures the environment
- THEN it MUST detect the user's shell (e.g., bash, zsh)
- AND it MUST append `export PATH="$HOME/.dev-tracker/bin:$PATH"` to the appropriate RC file (e.g., `.bashrc`, `.zshrc`)
- AND it MUST be idempotent, skipping the export if it already exists

### Requirement: Idempotency and Safety

The installation script MUST NOT corrupt existing shell RC files or system binaries.

#### Scenario: Re-running the installer
- GIVEN the CLI is already installed
- WHEN the user runs the installer script again
- THEN it MUST overwrite the existing binary with the downloaded one
- AND it MUST NOT duplicate the PATH export line in the shell RC file

#### Scenario: Rollback/Uninstallation
- GIVEN the CLI is installed
- WHEN the user removes the `~/.dev-tracker` directory and PATH export
- THEN the system MUST NOT leave behind any global system modifications (`/usr/local/bin` etc. should be untouched)
