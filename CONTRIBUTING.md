# Contributing

## Branching

- Create feature branches from `main`:
  - `feature/<short-name>`
  - `fix/<short-name>`

## Canonical local workflow

1. Create a branch

```bash
git checkout -b feature/my-change
```

2. Use Codex CLI for implementation

```bash
codex
```

Prompt pattern:

- intent
- constraints
- how correctness is validated (tests / lint / typecheck)

3. Review diffs (human)

```bash
git diff
```

4. Run canonical checks

```bash
make ci
make scan-secrets
```

To run tests locally during development:

```bash
make test
```

To run full release readiness checks locally:

```bash
make release-check
```

5. Commit (human-authored message)

```bash
git commit -am "Implement X"
```

6. Push + open PR.

## Public release expectations

- Package remains MIT licensed (`LICENSE` + `package.json` license field).
- No secrets or credentials in tracked files.
- `npm pack --dry-run` contains only intended publishable artifacts.
- Release notes and public docs are updated when behavior changes.

## Definition of done

- `make ci` passes
- `make scan-secrets` passes
- Tests cover meaningful behavior (happy path + error path)
- No undocumented behavior changes
