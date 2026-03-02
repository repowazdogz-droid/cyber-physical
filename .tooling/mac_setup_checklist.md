# Mac Setup Checklist (Omega Spine)

## 1) System
- [ ] macOS updated
- [ ] iCloud signed in (optional)
- [ ] Cursor installed + opened at `omega/`

## 2) Xcode Command Line Tools (Git + build tools)
- [ ] Install: `xcode-select --install`
- [ ] Verify: `git --version`

## 3) Homebrew
- [ ] Install Homebrew
- [ ] Verify: `brew --version`

## 4) Core utilities
- [ ] Install: `brew install ripgrep fd`
- [ ] Verify: `rg --version` and `fd --version`

## 5) Python (brew)
- [ ] Install: `brew install python`
- [ ] Verify: `python3 --version` and `pip3 --version`

## 6) Project venv (no system Python)
- [ ] Create: `python3 -m venv .venv`
- [ ] Activate: `source .venv/bin/activate`
- [ ] Verify: `which python` points to `omega/.venv/...`

## 7) Git sanity
- [ ] `git status` runs in repo
- [ ] `git remote -v` shows your GitHub remote (if connected)

## Done condition
You are "Mac-ready" when steps 1–7 are green.

