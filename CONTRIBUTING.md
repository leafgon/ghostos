# Contributing

## Branching
- Create feature branches from `main`:
  - `feature/<short-name>`
  - `fix/<short-name>`

## Canonical local workflow
1) Create a branch
```bash
git checkout -b feature/my-change
```

2) Use Codex CLI for implementation
```bash
codex
```

Prompt pattern:
- intent
- constraints
- how correctness is validated (tests / lint / typecheck)

3) Review diffs (human)
```bash
git diff
```

4) Run canonical checks
```bash
make ci
```

5) Commit (human-authored message)
```bash
git commit -am "Implement X"
```

6) Push + open PR.

## Definition of done
- `make ci` passes
- Tests cover meaningful behavior (happy path + error path)
- No undocumented behavior changes
