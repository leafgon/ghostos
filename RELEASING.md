# Releasing ghostos to npm

## Preflight

```bash
npm ci
make release-check
```

`make release-check` runs CI, a secret-pattern scan, and `npm pack --dry-run`.

## Verify package metadata

- `package.json` has the intended version.
- `package.json` keeps `"license": "MIT"`.
- `LICENSE` remains present and unchanged.
- release notes are updated when applicable.

## Build package and inspect tarball

```bash
npm run build
npm pack
tar -tf ghostos-*.tgz
```

Confirm only intended publishable artifacts are included.

## Installability smoke test

```bash
mkdir /tmp/pkg-test && cd /tmp/pkg-test
npm init -y
npm i /path/to/ghostos-x.y.z.tgz
node -e "import('ghostos').then(m=>console.log(Object.keys(m)))"
```

## Publish

```bash
npm login
npm publish
```

`prepublishOnly` runs `npm run release:check` automatically before publish.
