#!/usr/bin/env bash
set -e

# Check for Homebrew
if ! command -v brew >/dev/null 2>&1; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [[ -f "/opt/homebrew/bin/brew" ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -f "/usr/local/bin/brew" ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
fi

# Core tools
echo "Installing core tools..."
brew install git gh python pyenv node nvm ripgrep fd jq tree || true

# pyenv init
if command -v pyenv >/dev/null 2>&1; then
  if ! grep -q "pyenv init" ~/.zshrc 2>/dev/null && ! grep -q "pyenv init" ~/.bash_profile 2>/dev/null; then
    echo 'eval "$(pyenv init -)"' >> ~/.zshrc 2>/dev/null || echo 'eval "$(pyenv init -)"' >> ~/.bash_profile 2>/dev/null || true
  fi
fi

# nvm init
if [ -d "$HOME/.nvm" ] || brew list nvm >/dev/null 2>&1; then
  NVM_DIR="$HOME/.nvm"
  if ! grep -q "NVM_DIR" ~/.zshrc 2>/dev/null && ! grep -q "NVM_DIR" ~/.bash_profile 2>/dev/null; then
    echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc 2>/dev/null || echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bash_profile 2>/dev/null || true
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc 2>/dev/null || echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bash_profile 2>/dev/null || true
  fi
fi

echo "Mac tools installation complete"
exit 0

