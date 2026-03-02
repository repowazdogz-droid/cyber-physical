#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../omega-spatial-site"

# hard-kill anything on 3001 to avoid "wrong site" confusion
lsof -nP -iTCP:3001 -sTCP:LISTEN | awk 'NR>1 {print $2}' | xargs -I{} kill -9 {} 2>/dev/null || true

npm run dev


































