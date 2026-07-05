#!/bin/bash
set -e

echo "Running tests for install.sh..."

TEST_DIR=$(mktemp -d)
# Clean up on exit
trap 'rm -r "$TEST_DIR"' EXIT

# Mock environment
export HOME="$TEST_DIR"
export DEV_TRACKER_BIN="$HOME/.dev-tracker/bin"
mkdir -p "$DEV_TRACKER_BIN"

# Mock dummy RC files
touch "$HOME/.bashrc"
touch "$HOME/.zshrc"

# We mock curl to just create a dummy file instead of downloading
mkdir -p "$TEST_DIR/bin"
cat << 'MOCK' > "$TEST_DIR/bin/curl"
#!/bin/bash
echo "Mock curl called"
output_file=""
for arg in "$@"; do
  if [[ "$arg" == -o* ]]; then
    output_file="${arg#-o}"
  elif [[ "$prev_arg" == "-o" ]]; then
    output_file="$arg"
  fi
  prev_arg="$arg"
done

if [ -n "$output_file" ]; then
  echo "mock binary" > "$output_file"
fi
MOCK
chmod +x "$TEST_DIR/bin/curl"

# Mock uname
cat << 'MOCK' > "$TEST_DIR/bin/uname"
#!/bin/bash
if [ "$1" = "-s" ]; then echo "Linux"; fi
if [ "$1" = "-m" ]; then echo "x86_64"; fi
MOCK
chmod +x "$TEST_DIR/bin/uname"

export PATH="$TEST_DIR/bin:$PATH"

# Run the install script
bash "$(dirname "$0")/install.sh"

# Assertions
echo "Checking if binary was created..."
if [ ! -f "$DEV_TRACKER_BIN/dt" ]; then
    echo "FAIL: dt binary not found in $DEV_TRACKER_BIN"
    exit 1
fi

echo "Checking if binary is executable..."
if [ ! -x "$DEV_TRACKER_BIN/dt" ]; then
    echo "FAIL: dt binary is not executable"
    exit 1
fi

echo "Checking if PATH was injected into .bashrc..."
if ! grep -q 'export PATH="$HOME/.dev-tracker/bin:$PATH"' "$HOME/.bashrc"; then
    echo "FAIL: PATH not injected into .bashrc"
    exit 1
fi

echo "Checking if PATH was injected into .zshrc..."
if ! grep -q 'export PATH="$HOME/.dev-tracker/bin:$PATH"' "$HOME/.zshrc"; then
    echo "FAIL: PATH not injected into .zshrc"
    exit 1
fi

echo "Checking idempotency..."
# Run again
bash "$(dirname "$0")/install.sh"
COUNT=$(grep -c 'export PATH="$HOME/.dev-tracker/bin:$PATH"' "$HOME/.bashrc")
if [ "$COUNT" -ne 1 ]; then
    echo "FAIL: PATH injected multiple times into .bashrc"
    exit 1
fi

echo "PASS: All tests for install.sh passed."
