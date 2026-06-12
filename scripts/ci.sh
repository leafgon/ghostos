#!/usr/bin/env bash
set -euo pipefail

echo "==> CI: format check"
./scripts/fmt.sh --check

echo "==> CI: lint"
./scripts/lint.sh

echo "==> CI: typecheck"
./scripts/typecheck.sh

echo "==> CI: build"
npm run -s build

echo "==> CI: test"
./scripts/test.sh

echo "==> CI: OK"
