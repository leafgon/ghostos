## Publishing on npmjs

### Build package and sanity-check the tarball
```bash
npm ci
npm run build
npm pack             # creates ./ghostos-x.y.z.tgz
tar -tf ghostos-*.tgz  # confirm only the files you expect are inside
```
### Test the package for installability locally
```bash
mkdir /tmp/pkg-test && cd /tmp/pkg-test
npm init -y
npm i /path/to/ghostos-x.y.z.tgz
node -e "import('ghostos').then(m=>console.log(Object.keys(m)))"
```
### Log in and publish on npmjs
```bash
npm login                          # enter your npmjs.com credentials
npm publish                        # publish
```
