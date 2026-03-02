#!/bin/bash
echo "🔪 Clearing dev ports..."
for port in {3000..3010}; do
  lsof -ti tcp:$port | xargs kill -9 2>/dev/null
done
echo "✅ Ports cleared"





























