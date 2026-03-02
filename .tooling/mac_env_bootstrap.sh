#!/usr/bin/env bash
set -e

echo "🔧 Omega Mac environment bootstrap starting..."

# Ensure Homebrew exists
if ! command -v brew >/dev/null 2>&1; then
  echo "❌ Homebrew not found. Install Homebrew first."
  exit 1
fi

# Core utilities
brew install ripgrep fd || true

# Python
brew install python || true

# Virtual environment
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  echo "✅ Virtual environment created"
else
  echo "ℹ️ Virtual environment already exists"
fi

# Activate venv
source .venv/bin/activate

# Upgrade pip
pip install --upgrade pip

echo "✅ Omega Mac environment ready"
echo "👉 Activate anytime with: source .venv/bin/activate"

