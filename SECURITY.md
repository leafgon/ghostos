# Security Policy

## Supported versions

Only the latest published npm release is supported for security fixes.

## Reporting

If you discover a security issue, do not open a public issue. Contact maintainers privately and include:

- impact summary
- reproduction steps
- affected version(s)
- suggested mitigation, if known

Use GitHub private security reporting when available for this repository.

## Development constraints

- Never commit secrets.
- No plaintext credentials in code, logs, or tests.
- Any authn/authz changes require explicit reviewer approval.

## Release hygiene

- Run `make scan-secrets` before publish.
- Use short-lived tokens and environment variables for local release operations.
- Never place credentials in docs, examples, fixtures, or release notes.
