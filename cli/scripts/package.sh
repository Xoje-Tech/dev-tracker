#!/bin/bash
# cli/scripts/package.sh — pkg wrapper that injects DT_CLI_VERSION at
# build time so production binaries self-describe correctly.
#
# Background: see issue #91. Without this script, `pkg .` produces
# binaries whose embedded __dirname points at the synthetic snapshot
# root, breaking the runtime package.json resolution in
# cli/src/version.ts. The runtime helper falls back to walking from
# process.cwd() and ultimately to the literal "unknown" string.
#
# By reading the version from package.json and exporting it as
# DT_CLI_VERSION before invoking pkg, we ensure getCliVersion() picks
# up the env-var branch first and returns the correct version.
#
# This script is platform-agnostic (Linux, macOS) and works in CI
# (no interactive prompts).

set -euo pipefail

# Resolve the project root: this script lives at <root>/cli/scripts/package.sh.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read the version from the same package.json pkg will consume. We use
# node to parse it (jq may not be available everywhere, and pkg itself
# ships with node).
VERSION="$(node -p "require('${ROOT_DIR}/package.json').version")"

# Sanity check: refuse to build if the version is missing or weird.
if [[ ! "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+([-.+][A-Za-z0-9.]+)?$ ]]; then
  echo "[package.sh] Refusing to build: version '${VERSION}' is not a valid semver string" >&2
  exit 1
fi

echo "[package.sh] Building with DT_CLI_VERSION=${VERSION}"

# Export the version so version.ts picks it up via process.env.
# pkg bakes process.env reads into the binary's snapshot, so this
# works even after the file system is virtualised.
export DT_CLI_VERSION="${VERSION}"

# Invoke pkg from the CLI root so it finds package.json there.
cd "${ROOT_DIR}"
exec pnpm exec pkg .
