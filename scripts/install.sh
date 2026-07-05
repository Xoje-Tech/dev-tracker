#!/bin/bash
set -e

echo "Installing Dev Tracker CLI (dt)..."

# Detect OS and architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux*)   OS="linux" ;;
  Darwin*)  OS="macos" ;;
  *)        echo "Unsupported OS: $OS"; exit 1 ;;
esac

case "$ARCH" in
  x86_64)   ARCH="x64" ;;
  amd64)    ARCH="x64" ;;
  arm64)    ARCH="arm64" ;;
  aarch64)  ARCH="arm64" ;;
  *)        echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

if [ "$OS" = "linux" ] && [ "$ARCH" = "arm64" ]; then
    echo "Linux arm64 is currently not explicitly packaged. Proceeding but may fail."
fi

# Define target directory
DEV_TRACKER_BIN="$HOME/.dev-tracker/bin"
mkdir -p "$DEV_TRACKER_BIN"

# Download binary
URL="https://github.com/xoje-tech/dev-tracker/releases/latest/download/dt-${OS}-${ARCH}"
TARGET="$DEV_TRACKER_BIN/dt"

echo "Downloading from $URL..."
curl -sL "$URL" -o "$TARGET" || { echo "Download failed"; exit 1; }

# Make executable
chmod +x "$TARGET"
echo "Installed to $TARGET"

# Inject into PATH idempotently
PATH_EXPORT='export PATH="$HOME/.dev-tracker/bin:$PATH"'

inject_path() {
    local rc_file="$1"
    if [ -f "$rc_file" ]; then
        if ! grep -q "$PATH_EXPORT" "$rc_file"; then
            echo "" >> "$rc_file"
            echo "# Dev Tracker CLI" >> "$rc_file"
            echo "$PATH_EXPORT" >> "$rc_file"
            echo "Added Dev Tracker CLI to $rc_file"
        else
            echo "Dev Tracker CLI already in $rc_file"
        fi
    fi
}

inject_path "$HOME/.bashrc"
inject_path "$HOME/.zshrc"

echo "Installation complete!"
echo "Please restart your terminal or run:"
echo "  source ~/.bashrc"
