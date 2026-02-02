#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"

if [[ "$MODE" == "--check" ]]; then
  npm run -s fmt:check
else
  npm run -s fmt
fi
