#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PATTERN='(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z\-_]{35}|npm_[A-Za-z0-9]{36}|-----BEGIN (RSA|EC|OPENSSH|DSA|PGP) PRIVATE KEY-----|mongodb\+srv://[^\s]+|postgres://[^\s]+:[^\s]+@|mysql://[^\s]+:[^\s]+@|\b(NPM_TOKEN|AWS_SECRET_ACCESS_KEY|OPENAI_API_KEY)\b\s*[=:]\s*["'"'][^"'"']+["'"'])'

MATCHES="$(rg -n -S "$PATTERN" . \
  --hidden \
  --glob '!.git/**' \
  --glob '!node_modules/**' \
  --glob '!.codex-worktrees/**' \
  --glob '!scripts/scan-secrets.sh' \
  --glob '!lib/**' \
  --glob '!tests/**' \
  --glob '!**/*.test.*' \
  --glob '!**/*.spec.*' \
  --glob '!docs/release-notes/**' \
  --glob '!package-lock.json' || true)"

if [[ -n "$MATCHES" ]]; then
  echo "Potential secret-like strings found in tracked non-test files:"
  echo "$MATCHES"
  exit 1
fi

echo "No high-confidence secret patterns found in tracked non-test sources."
