#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INTERVAL=$((3 * 60 * 60))

while true; do
  if (( RANDOM % 2 == 0 )); then
    BACKEND="opencode"
  else
    BACKEND="cursor"
  fi
  echo "=== [$(date)] Starting agent run (backend: $BACKEND) ==="
  "$SCRIPT_DIR/run_agent.sh" "$BACKEND" || echo "=== [$(date)] Agent run failed, continuing ==="
  echo "=== [$(date)] Next run in 3 hours ==="
  sleep "$INTERVAL"
done
