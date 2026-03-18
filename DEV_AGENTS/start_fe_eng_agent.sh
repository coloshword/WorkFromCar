#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INTERVAL=$((3 * 60 * 60))

while true; do
  echo "=== [$(date)] Starting agent run ==="
  "$SCRIPT_DIR/run_agent.sh" || echo "=== [$(date)] Agent run failed, continuing ==="
  echo "=== [$(date)] Next run in 3 hours ==="
  sleep "$INTERVAL"
done
