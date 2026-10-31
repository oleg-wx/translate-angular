# Simply Translate for Angular

[![Test](https://github.com/oleg-wx/translate-angular/actions/workflows/test.yml/badge.svg)](https://github.com/oleg-wx/translate-angular/actions/workflows/test.yml)

Monorepo for [simply-translate](https://www.npmjs.com/package/simply-translate) Angular bindings. Two independently published libraries:

### [simply-translate-angular](projects/translate/README.md)

The core translation library — `provideTranslate()`, standalone directive and pipes, `TranslateService`, and dictionary loading (root/lazy). See [projects/translate/README.md](projects/translate/README.md) for setup and usage, and its [changelog](projects/translate/CHANGELOG.md).

### [simply-translate-angular-proxy](projects/proxy/README.md)

Optional add-on built on top of `simply-translate-angular` — `TranslateProxy` for typed, autocompleted access to dictionary keys, schema-based dictionary validation, and per-proxy dictionary loading. See [projects/proxy/README.md](projects/proxy/README.md) for setup and usage, and its [changelog](projects/proxy/CHANGELOG.md).

## Versions

Both packages follow Angular's major version: 21.x is built for Angular 21 and later, 20.x for Angular 20, 19.x for Angular 19. For Angular 17–18 use 1.x.

21.0.0 removes the deprecated `TranslateModule` (`forRoot()` / `forChild()`); see [Migrating from TranslateModule](projects/translate/README.md#migrating-from-translatemodule).
