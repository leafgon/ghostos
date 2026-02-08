# GitHub-Hosted Leafgraphs

This guide explains how to reference leafgraphs stored as JSON files in GitHub repositories.

## Address format
Use `github` as the domain and provide the GitHub user/org, repo, and file path.

- `github/<github-user>/<repo>/<path>`
- `github/<github-user>/<repo>@<ref>/<path>` (optional ref, default `main`)
- `github/<github-user>/<repo>/<path>?token=<some token>`

The `.json` extension is optional; it will be appended if missing.

## Examples
- `github/leafgon/leafgraphs/tests/breezyforest-testbed`
- `github/leafgon/leafgraphs@dev/tests/breezyforest-testbed.json`
- `github/leafgon/leafgraphs/tests/breezyforest-testbed?token=abc123`

## How it resolves
Given `github/leafgon/leafgraphs/tests/breezyforest-testbed`, the runtime fetches:

```
https://raw.githubusercontent.com/leafgon/leafgraphs/refs/heads/main/tests/breezyforest-testbed.json
```

If you supply `@ref`, it replaces `main` in the URL.

## Notes
- GitHub paths are case-sensitive; keep the exact casing of folders and files.
- `?token=...` is passed through to the raw URL as-is.
- Loading GitHub leafgraphs requires network access and a runtime that provides `fetch`.
