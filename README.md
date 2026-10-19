# Simply Translate for Angular

[![Test](https://github.com/oleg-wx/translate-angular/actions/workflows/test.yml/badge.svg)](https://github.com/oleg-wx/translate-angular/actions/workflows/test.yml)

Monorepo for [simply-translate](https://www.npmjs.com/package/simply-translate) Angular bindings. Two independently published libraries:

### [simply-translate-angular](projects/translate/README.md)

The core translation library — `provideTranslate()`, standalone directive and pipes, `TranslateService`, and dictionary loading (root/lazy). See [projects/translate/README.md](projects/translate/README.md) for setup and usage, and its [changelog](projects/translate/CHANGELOG.md).

### [simply-translate-angular-proxy](projects/proxy/README.md)

Optional add-on built on top of `simply-translate-angular` — `TranslateProxy` for typed, autocompleted access to dictionary keys, schema-based dictionary validation, and per-proxy dictionary loading. See [projects/proxy/README.md](projects/proxy/README.md) for setup and usage, and its [changelog](projects/proxy/CHANGELOG.md).

## Versions

Both packages follow Angular's major version: 20.x is built for Angular 20 and later, 19.x for Angular 19. For Angular 17–18 use 1.x.

## Development

Requires Node 20.19+, 22.12+ or 24 (the versions Angular 20 supports).

```bash
npm ci
npm test            # both libraries and the demo app, once in headless Chrome
npm run build:prod  # builds dist/translate and dist/proxy
npm run start:demo  # demo app on http://localhost:4800 (run build:prod first)
```

The libraries live in `projects/translate` and `projects/proxy`, the demo app in `projects/demo`. The proxy library imports `simply-translate-angular` from `dist/translate`, and the demo app imports both libraries from `dist`, so build them before working on the proxy or the demo — `npm test` does it in order.

## Releasing

1. Bump `version` in `projects/<translate|proxy>/package.json` and move the `(unreleased)` heading in that project's `CHANGELOG.md` to the new version. Keep the major version equal to the Angular version the release is built for.
2. Publish a GitHub Release whose tag is `<package name>@<version>`, for example `simply-translate-angular@20.0.0` or `simply-translate-angular-proxy@20.0.0`.

The [Publish workflow](.github/workflows/publish.yml) checks that the tag matches the package version, runs the tests, and publishes that package to npm using trusted publishing, so no token is needed. Versions with a pre-release suffix (`20.1.0-beta.1`) go to the `next` dist-tag.

### Publishing from your machine

Needs an npm access token with write access to the package, read from the `NPM_TOKEN` environment variable (see [.npmrc](.npmrc)). With [Task](https://taskfile.dev), put it in a `.env` file in the repository root, which git ignores:

```bash
# .env
NPM_TOKEN=npm_xxxxxxxx
```

```bash
task publish:translate
task publish:proxy
```

Without Task, set `NPM_TOKEN` in the environment and run `npm run publish:translate` / `npm run publish:proxy`.
