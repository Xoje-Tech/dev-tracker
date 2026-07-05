# E2E Testing Instructions for CLI Global Installer

To verify the standalone executable does not depend on Node.js on the host system, you must run it inside a clean Docker container.

## 1. Build the Binaries

Generate the bundled executables using `pkg`:

```bash
cd cli
pnpm run build
pnpm run package
```

This will create `dt-linux-x64`, `dt-macos-x64`, etc., in the `cli/binaries` directory.

## 2. Test in a Clean Linux Container

Start an interactive shell in a raw Alpine or Ubuntu container (which does not have Node.js installed by default):

```bash
# Using Ubuntu to test glibc compatibility
docker run -it --rm -v $(pwd)/cli/binaries:/binaries ubuntu:latest /bin/bash
```

Inside the container:
```bash
# Run the binary directly
/binaries/dt-linux-x64 --help

# Verify it outputs the CLI help text instead of failing with missing Node dependencies
```

## 3. Verify Install Script in Container

To test the `install.sh` script end-to-end:

```bash
docker run -it --rm ubuntu:latest /bin/bash

# Install curl
apt-get update && apt-get install -y curl

# Run the installer (using your local branch if pushed, or mount the script)
curl -sL https://raw.githubusercontent.com/xoje-tech/dev-tracker/master/scripts/install.sh | bash

# Reload bash to get the updated PATH
source ~/.bashrc

# Run dt
dt --help
```