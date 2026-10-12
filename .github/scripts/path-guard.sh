#!/usr/bin/env bash
# Fail a pull request opened by the Hermes agent if it touches paths only the owner may change.
# Usage: path-guard.sh <pr-author-login> <head-ref> <bot-login>  (changed paths on stdin)
set -euo pipefail

if [ "$#" -ne 3 ] || [ -z "$1" ] || [ -z "$3" ]; then
  echo "usage: path-guard.sh <pr-author-login> <head-ref> <bot-login>" >&2
  exit 2
fi
author="$1" head_ref="$2" bot="$3"

if [ "$author" != "$bot" ] && [[ "$head_ref" != hermes/* ]]; then
  cat >/dev/null
  echo "path-guard: not an agent PR ($author, $head_ref); nothing to check"
  exit 0
fi

# CI, editor/agent config, build scripts, dependencies and the extension manifests (permissions).
protected='^(\.github/|\.claude/|\.vscode/|\.devcontainer/|scripts/|manifest\.[a-z]+\.json$|package(-lock)?\.json$)|(^|/)(CLAUDE|AGENTS)\.md$'
violations="$(grep -E "$protected" || true)"
if [ -n "$violations" ]; then
  echo "path-guard: agent PR touches protected paths:" >&2
  printf '%s\n' "$violations" >&2
  exit 1
fi
echo "path-guard: agent PR touches no protected paths"
