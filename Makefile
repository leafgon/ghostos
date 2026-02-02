SHELL := /usr/bin/env bash

.PHONY: help fmt lint typecheck test ci

help:
	@echo "Targets:"
	@echo "  make fmt        - format code (writes)"
	@echo "  make lint       - run lint checks"
	@echo "  make typecheck  - run type checks"
	@echo "  make test       - run tests"
	@echo "  make ci         - run fmt(check)+lint+typecheck+test"

fmt:
	./scripts/fmt.sh

lint:
	./scripts/lint.sh

typecheck:
	./scripts/typecheck.sh

test:
	./scripts/test.sh

ci:
	./scripts/ci.sh
