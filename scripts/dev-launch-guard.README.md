# Dev Launch Guard

**Developer safety utility — prevents context mistakes.**

## PURPOSE

- Prevents running `npm run dev` from the wrong directory
- Prevents port collisions (kills processes on ports 3000-3010)
- Makes app identity visually obvious (banner with name, path, port)

## USAGE

**Canonical dev command for all Omega development:**

```bash
npm run dev:safe
```

**This replaces `npm run dev` for all Omega development.**

For optional full checks (lint + typecheck, slow):

```bash
npm run dev:full-check
```

## WHAT IT DOES

### 1. Port Cleanup (Pre-flight)

Before starting dev server:
- Kills processes on ports 3000-3010
- macOS/Linux compatible
- Fails silently if ports are unused

### 2. Project Verification

Before running dev:
- Checks for `package.json` in current directory
- If missing: prints clear error and exits

**Error message:**
```
❌ ERROR: No package.json found.
   You are not inside a runnable Omega app.
   Current directory: /path/to/wrong/dir
```

### 3. App Identity Banner

When dev starts, prints:

```
============================================================
OMEGA DEV SERVER
============================================================
App:  omega-spatial-site
Path: /Users/warre/Omega/omega-spatial-site
Port: 3001
============================================================
```

This appears every time.

### 4. One-Command Usage

Add to `package.json`:

```json
{
  "scripts": {
    "dev:safe": "node ../../scripts/dev-launch-guard.mjs"
  }
}
```

Or for root:

```json
{
  "scripts": {
    "dev:safe": "node scripts/dev-launch-guard.mjs"
  }
}
```

## EXAMPLE OUTPUT

### Success Case

```bash
$ cd omega-spatial-site
$ npm run dev:safe

🧹 Cleaning ports 3000-3010...
✅ Port cleanup complete

============================================================
OMEGA DEV SERVER
============================================================
App:  omega-spatial-site
Path: /Users/warre/Omega/omega-spatial-site
Port: 3001
============================================================

🚀 Starting dev server...

[next.js output...]
```

### Failure Case (Wrong Directory)

```bash
$ cd /tmp
$ npm run dev:safe

🧹 Cleaning ports 3000-3010...
✅ Port cleanup complete

❌ ERROR: No package.json found.
   You are not inside a runnable Omega app.
   Current directory: /tmp
```

## COMMAND RESOLUTION

**`npm run dev:safe`** (fast, always-use):
- Port cleanup (3000-3010)
- Project verification
- App identity banner
- Starts dev server immediately
- **Does NOT run lint or typecheck**

**`npm run dev:full-check`** (optional, slow):
- Runs linting
- Runs typechecking
- Runs tests (if configured)
- Use only when you need full pre-flight checks

**`dev:safe` replaces `npm run dev` for all Omega development.**

## CONSTRAINTS

✅ **Does:**
- Port cleanup (3000-3010)
- Project verification
- App identity banner
- Wraps existing dev script

❌ **Does NOT:**
- Modify existing dev scripts
- Affect production builds
- Introduce dependencies (uses Node built-ins only)
- Run linting or typechecking
- Run tests
- Open browser automatically

**This block exists solely to protect the developer from context mistakes.**

## FILE LOCATION

```
scripts/
  dev-launch-guard.mjs      # Main script
  dev-launch-guard.README.md # This file
```

## INTEGRATION

Add to each app's `package.json`:

**Root app:**
```json
"dev:safe": "node scripts/dev-launch-guard.mjs"
```

**Sub-apps (e.g., omega-spatial-site):**
```json
"dev:safe": "node ../../scripts/dev-launch-guard.mjs"
```

