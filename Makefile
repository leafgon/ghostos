SHELL := /usr/bin/env bash

.PHONY: help fmt lint typecheck test scan-secrets validate-breezyforest-tests release-check ci

help:
	@echo "Targets:"
	@echo "  make fmt        - format code (writes)"
	@echo "  make lint       - run lint checks"
	@echo "  make typecheck  - run type checks"
	@echo "  make test       - run tests"
	@echo "  make scan-secrets - run high-confidence secret scan"
	@echo "  make validate-breezyforest-tests - validate spells in breezyforest/tests"
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

validate-breezyforest-tests:
	npm run -s validate:breezyforest-tests

release-check:
	./scripts/ci.sh
	./scripts/scan-secrets.sh
	npm pack --dry-run

ci:
	./scripts/ci.sh
