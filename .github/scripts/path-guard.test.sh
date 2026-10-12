#!/usr/bin/env bash
# Table tests for path-guard.sh: each case is "expected-exit|author|head-ref|newline-separated paths".
set -u
here="$(cd "$(dirname "$0")" && pwd)"
bot='hermes-agent[bot]'
fail=0

check() {
  local want="$1" author="$2" ref="$3" paths="$4" got
  printf '%b' "$paths" | "$here/path-guard.sh" "$author" "$ref" "$bot" >/dev/null 2>&1
  got=$?
  if [ "$got" = "$want" ]; then
    echo "PASS  exit=$got  $author $ref $(printf '%b' "$paths" | tr '\n' ' ')"
  else
    echo "FAIL  want=$want got=$got  $author $ref $(printf '%b' "$paths" | tr '\n' ' ')"
    fail=1
  fi
}

check 0 ovanov      feature/x     '.github/workflows/ci.yml\n'
check 1 "$bot"      hermes/x      '.github/scripts/path-guard.sh\n'
check 1 "$bot"      hermes/x      'README.md\n.github/CODEOWNERS\n'
check 1 ovanov      hermes/x      '.github/workflows/x.yml\n'
check 1 "$bot"      hermes/x      '.claude/settings.json\n'
check 1 "$bot"      hermes/x      '.vscode/tasks.json\n'
check 1 "$bot"      hermes/x      '.devcontainer/devcontainer.json\n'
check 1 "$bot"      hermes/x      'CLAUDE.md\n'
check 1 "$bot"      hermes/x      'src/AGENTS.md\n'
check 0 "$bot"      hermes/x      'docs/claude.md\n'
check 0 "$bot"      hermes/x      ''
check 2 ''          ''            'README.md\n'
check 1 "$bot"      hermes/x      'manifest.chrome.json\n'
check 1 "$bot"      hermes/x      'manifest.firefox.json\n'
check 1 "$bot"      hermes/x      'package.json\n'
check 1 "$bot"      hermes/x      'package-lock.json\n'
check 1 "$bot"      hermes/x      'scripts/build.mjs\n'
check 0 "$bot"      hermes/x      'src/simplify.ts\npopup.ts\ndocs/usage.md\nsrc/package.json\n'

exit "$fail"
