#!/usr/bin/env bash
set -e

PASS_COUNT=0
FAIL_COUNT=0

check_macos_version() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    VERSION=$(sw_vers -productVersion)
    echo "PASS: macOS version $VERSION detected"
    ((PASS_COUNT++))
  else
    echo "FAIL: Not running on macOS"
    ((FAIL_COUNT++))
  fi
}

check_cpu_architecture() {
  ARCH=$(uname -m)
  if [[ "$ARCH" == "arm64" ]]; then
    echo "PASS: Apple Silicon (arm64) detected"
    ((PASS_COUNT++))
  else
    echo "FAIL: Expected Apple Silicon (arm64), found $ARCH"
    ((FAIL_COUNT++))
  fi
}

check_homebrew() {
  if command -v brew >/dev/null 2>&1; then
    VERSION=$(brew --version | head -n1)
    echo "PASS: Homebrew installed ($VERSION)"
    ((PASS_COUNT++))
  else
    echo "FAIL: Homebrew not installed"
    ((FAIL_COUNT++))
  fi
}

check_git() {
  if command -v git >/dev/null 2>&1; then
    VERSION=$(git --version)
    if git config user.name >/dev/null 2>&1 && git config user.email >/dev/null 2>&1; then
      echo "PASS: Git installed and configured ($VERSION)"
      ((PASS_COUNT++))
    else
      echo "FAIL: Git installed but not configured (missing user.name or user.email)"
      ((FAIL_COUNT++))
    fi
  else
    echo "FAIL: Git not installed"
    ((FAIL_COUNT++))
  fi
}

check_cursor() {
  if [ -f "/Applications/Cursor.app/Contents/MacOS/Cursor" ] || command -v cursor >/dev/null 2>&1; then
    echo "PASS: Cursor installed"
    ((PASS_COUNT++))
  else
    echo "FAIL: Cursor not found"
    ((FAIL_COUNT++))
  fi
}

check_python() {
  if command -v python3 >/dev/null 2>&1; then
    VERSION=$(python3 --version | cut -d' ' -f2)
    MAJOR=$(echo $VERSION | cut -d'.' -f1)
    MINOR=$(echo $VERSION | cut -d'.' -f2)
    if [ "$MAJOR" -eq 3 ] && [ "$MINOR" -ge 11 ]; then
      echo "PASS: Python $VERSION (3.11+) available"
      ((PASS_COUNT++))
    else
      echo "FAIL: Python $VERSION found, but 3.11+ required"
      ((FAIL_COUNT++))
    fi
  else
    echo "FAIL: Python 3 not found"
    ((FAIL_COUNT++))
  fi
}

check_nodejs() {
  if command -v node >/dev/null 2>&1; then
    VERSION=$(node --version)
    echo "PASS: Node.js $VERSION available"
    ((PASS_COUNT++))
  else
    echo "FAIL: Node.js not found"
    ((FAIL_COUNT++))
  fi
}

check_docker() {
  if command -v docker >/dev/null 2>&1; then
    VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    echo "PASS: Docker installed ($VERSION)"
    ((PASS_COUNT++))
  else
    echo "FAIL: Docker not installed (optional but recommended)"
    ((FAIL_COUNT++))
  fi
}

check_disk_space() {
  AVAILABLE=$(df -g . | tail -1 | awk '{print $4}')
  if [ "$AVAILABLE" -ge 100 ]; then
    echo "PASS: Disk space available ($AVAILABLE GB free)"
    ((PASS_COUNT++))
  else
    echo "FAIL: Insufficient disk space ($AVAILABLE GB free, need 100+ GB)"
    ((FAIL_COUNT++))
  fi
}

echo "Verifying Omega Mac environment..."
echo ""

check_macos_version
check_cpu_architecture
check_homebrew
check_git
check_cursor
check_python
check_nodejs
check_docker
check_disk_space

echo ""
echo "Summary: $PASS_COUNT passed, $FAIL_COUNT failed"

if [ $FAIL_COUNT -eq 0 ]; then
  echo "READY FOR SPINE WORK"
  exit 0
else
  echo "ACTION REQUIRED"
  exit 1
fi

