#!/usr/bin/env bash
set -euo pipefail

BACKEND="${1:-opencode}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

git checkout master
git pull origin master

BRANCH_ID="agent/$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 4)"
git checkout -b "$BRANCH_ID"

CURSOR_MODEL="composer-2"

case "$BACKEND" in
  opencode) AGENT_ID="opencode" ;;
  cursor)   AGENT_ID="$CURSOR_MODEL" ;;
esac

PROMPT="Read the file DEV_AGENTS/instructions.md and follow the instructions inside it exactly. Your agent identifier is: $AGENT_ID — include this in the PR as described in the instructions."

echo "Running agent (backend: $BACKEND, agent_id: $AGENT_ID) on branch: $BRANCH_ID"

case "$BACKEND" in
  opencode)
    opencode run "$PROMPT"
    ;;
  cursor)
    agent "$PROMPT" --model "$CURSOR_MODEL" --yolo
    ;;
  *)
    echo "Unknown backend: $BACKEND (use 'opencode' or 'cursor')"
    exit 1
    ;;
esac
