# Simply Translate for Angular

[![Test](https://github.com/oleg-wx/translate-angular/actions/workflows/test.yml/badge.svg)](https://github.com/oleg-wx/translate-angular/actions/workflows/test.yml)

Monorepo for [simply-translate](https://www.npmjs.com/package/simply-translate) Angular bindings. Two independently published libraries:

### [simply-translate-angular](projects/translate/README.md)

The core translation library — `TranslateModule`, directive, pipes, `TranslateService`, and dictionary loading (root/lazy). See [projects/translate/README.md](projects/translate/README.md) for setup and usage, and its [changelog](projects/translate/CHANGELOG.md).

### [simply-translate-angular-proxy](projects/proxy/README.md)

Optional add-on built on top of `simply-translate-angular` — `TranslateProxy` for typed, autocompleted access to dictionary keys, schema-based dictionary validation, and per-proxy dictionary loading. See [projects/proxy/README.md](projects/proxy/README.md) for setup and usage, and its [changelog](projects/proxy/CHANGELOG.md).

## Development

```bash
npm ci
npm test            # tests both libraries once in headless Chrome
npm run build:prod  # builds dist/translate and dist/proxy
npm run start:demo  # demo app on http://localhost:4800 (run build:prod first)
```

The proxy library and the demo app import `simply-translate-angular` from `dist/translate`, so build the translate library before working on them.

## Releasing

1. Bump `version` in `projects/<translate|proxy>/package.json` and move the `(unreleased)` heading in that project's `CHANGELOG.md` to the new version.
2. Publish a GitHub Release whose tag is `<package name>@<version>`, for example `simply-translate-angular@1.0.0` or `simply-translate-angular-proxy@1.0.0`.

The [Publish workflow](.github/workflows/publish.yml) checks that the tag matches the package version, runs the tests, and publishes that package to npm. Versions with a pre-release suffix (`1.1.0-beta.1`) go to the `next` dist-tag.
