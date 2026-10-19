# Changelog

All notable changes to `simply-translate-angular-proxy` are listed here.

## 21.0.0 (unreleased)

### Breaking

-   Requires Angular 21, TypeScript 5.9 and `simply-translate-angular` 21.0.0. For Angular 20 use 20.x of both packages.
-   `simply-translate-angular` 21 no longer has `TranslateModule`, so set up `TranslateService` with `provideTranslate()`.
-   `simply-translate-angular` and `rxjs` are peer dependencies instead of dependencies, so the application's single copy is used. A second copy of `simply-translate-angular` meant a second `TranslateService` class, and injecting a proxy failed with "No provider for TranslateService". Install both yourself, as the README already shows. `@angular/router` is an optional peer dependency, used only by `translateLoaderResolver`.

### Fixed

-   `onLoaderReady` was never called for a dictionary given as a plain object, because it loads before the proxy subscribed.
-   Two loader cache entries collided when an id and a language shared an underscore, for example id `a_b` with language `c` and id `a` with language `b_c`.
-   A destroyed proxy now completes its loader's ready and error streams instead of leaving them open.
-   A second proxy with the same loader id, for example one per `provideTranslateChild()` scope, now gets the dictionary on its own `TranslateService` and reports to its own `onLoaderReady`/`onLoaderError`, also while the first load is still in flight. It still makes no second request.
-   `onLoaderReady` and `onLoaderError` are called once the proxy is constructed, so the subclass's fields are initialized, and never after it is destroyed.
-   A dictionary given as a thenable that isn't the page's `Promise`, such as a native `import()` promise under zone.js, is awaited instead of being merged as if it were the dictionary.
-   A destroyed proxy no longer grafts or reports a load that finishes afterwards, and its `preloadLang()` does nothing. The load still fills the cache for other proxies.

## 20.0.0

### Breaking

-   Requires Angular 20, TypeScript 5.8 and `simply-translate-angular` 20.0.0. For Angular 19 use 19.x of both packages.

## 19.0.0

The major version now follows Angular's: 19.x is built for Angular 19.

### Breaking

-   Requires Angular 19, TypeScript 5.5 and `simply-translate-angular` 19.0.0.

## 1.0.0

First release as a separate package. The API moved here unchanged from `simply-translate-angular` 0.21.20. For earlier history see the [`simply-translate-angular` changelog](https://github.com/oleg-wx/translate-angular/blob/master/projects/translate/CHANGELOG.md).

### Upgrading from simply-translate-angular 0.21.x

1. `npm i simply-translate-angular-proxy`
2. Change imports of `TranslateProxy`, `TranslateProxyLoader`, `TranslateSchema`, `StringProp`, `ValueProp`, `Namespace`, `StringParam`, `NumberParam`, `StringNullableParam`, `NumberNullableParam`, `translateLoaderResolver`, `InferTranslateSchemaType`, `validateDictionary` and `assertValidDictionary` from `simply-translate-angular` to `simply-translate-angular-proxy`.
