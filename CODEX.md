# Codex Operating Contract

## Role model

- Codex: junior engineer (executes tasks)
- Human: tech lead + reviewer (approves plan, reviews diffs, ensures safety)

## Golden rules

1. **Plan first**: propose a short plan before editing.
2. **Small batches**: make incremental changes; run tests frequently.
3. **No surprises**: do not change public APIs, schemas, auth, security, or infra without explicit instruction.
4. **Use canonical commands only**:
   - `make fmt`, `make lint`, `make typecheck`, `make test`, `make ci`
5. **Evidence-based completion**: a task is “done” only if:
   - tests pass (`make test`)
   - and lint/typecheck pass (where configured)

## Change boundaries (must ask before touching)

- Authentication / authorization logic
- Cryptography / secrets handling
- Database migrations or schema changes
- Infrastructure / deployment
- Licensing / legal text

## Output format (when reporting)

- Summary of changes (bullets)
- Files changed
- Tests run + results
- Follow-ups / risks

## If uncertain

Stop and ask for guidance _before_ implementing.
