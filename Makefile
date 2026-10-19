SHELL := /usr/bin/env bash

.PHONY: help fmt lint typecheck test scan-secrets release-check ci

help:
	@echo "Targets:"
	@echo "  make fmt        - format code (writes)"
	@echo "  make lint       - run lint checks"
	@echo "  make typecheck  - run type checks"
	@echo "  make test       - run tests"
	@echo "  make scan-secrets - run high-confidence secret scan"
	@echo "  make release-check - run CI + secret scan + npm pack dry-run"
	@echo "  make ci         - run fmt(check)+lint+typecheck+build+test"

fmt:
	./scripts/fmt.sh

lint:
	./scripts/lint.sh

typecheck:
	./scripts/typecheck.sh

test:
	./scripts/test.sh

scan-secrets:
	./scripts/scan-secrets.sh

release-check:
	./scripts/ci.sh
	./scripts/scan-secrets.sh
	npm pack --dry-run

ci:
	./scripts/ci.sh
