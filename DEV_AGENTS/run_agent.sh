#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

git checkout master
git pull origin master

BRANCH_ID="agent/$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 4)"
git checkout -b "$BRANCH_ID"

echo "Running opencode agent on branch: $BRANCH_ID"

opencode run \
  "Read the file DEV_AGENTS/instructions.md and follow the instructions inside it exactly."
