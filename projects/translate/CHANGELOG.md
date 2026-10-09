# Changelog

All notable changes to `simply-translate-angular` are listed here.

## 1.0.0 (unreleased)

### Upgrading from 0.21.x

1. If you use `TranslateProxy`, `TranslateSchema`, the schema builders, `validateDictionary`/`assertValidDictionary` or `@TranslateProxyLoader`, install [`simply-translate-angular-proxy`](https://www.npmjs.com/package/simply-translate-angular-proxy) and import them from there instead of `simply-translate-angular`.
2. Apply the [simply-translate 1.0.0 upgrade steps](https://github.com/oleg-wx/translate/blob/master/CHANGELOG.md): `defaultLang` → `lang`, `$less: true` → `placeholder: 'single'`, and no deep imports such as `simply-translate/es/...`.

### Breaking

-   `TranslateProxy`, the schema API (`TranslateSchema`, `StringProp`, `ValueProp`, `Namespace`, param markers, `InferTranslateSchemaType`), dictionary validation, the per-proxy loader and `translateLoaderResolver` moved to the separate [`simply-translate-angular-proxy`](https://www.npmjs.com/package/simply-translate-angular-proxy) package.
-   Requires `simply-translate` 1.0.0.

### Fixed

-   The library no longer deep-imports `simply-translate` internals, which the `exports` map of `simply-translate` 1.0.0 blocks.

## 0.21.20

### Changed

-   Per-proxy loading is configured with the `@TranslateProxyLoader` decorator instead of implementing the `TranslateLoaderSupport` interface by hand.
-   `TranslateProxyLoader` gained `preloadLangs` and `preloadFallbackLang`.

### Added

-   `onLoaderReady?(args: { lang, id })` alongside `onLoaderError?()`. It fires whenever a language finishes loading.
-   `StringNullableParam` and `NumberNullableParam` param markers, which infer `string | null` and `number | null`.
-   `translateLoaderResolver(id)` route resolver that waits for a proxy's dictionary for the current language.

## 0.21.10

### Breaking

-   `TranslateProxy<T>` takes a schema type (`typeof yourSchema`) instead of a hand-written `Dictionary` interface.

### Added

-   Schema-first dictionary definitions (`TranslateSchema`, `StringProp`, `ValueProp`, `Namespace`).
-   Runtime validation (`validateDictionary`, `assertValidDictionary`), including placeholder checks against each leaf's declared `params`.

## 0.21.0

### Breaking

-   Requires Angular 17.
-   The directive always reacts to language and dictionary changes; the `detect` opt-in property is removed.

### Added

-   `TranslateProxy` for typed, autocompleted dictionary access.
-   The directive infers its key from static inner text when `translate` has no value.
-   `translateSignal` and `translateObservable` on `TranslateService`.

### Fixed

-   The directive updates the existing text node instead of writing to a new one, which broke content bound elsewhere in the same element (for example Angular interpolation).

## 0.20.0

See also the [simply-translate 0.20.0 changes](https://github.com/oleg-wx/translate/blob/master/CHANGELOG.md#0200).

### Added

-   [Middleware pipeline](README.md#pipeline).
-   `fallback` property on the directive.
-   Directives and pipes detect language changes.

### Deprecated

-   The `init` method in the root import. Use `addMiddleware`, `loadDictionaries` and `final` instead.

### Breaking

-   `lang` and `fallbackLang` moved to the root import, and after initialization they can be changed only through `TranslateRootService`.
-   `defaultLang` renamed to `lang`.
-   Removed `$less`. Use `placeholder: 'single'`.
-   `extend` in `forChild` renamed to `loadDictionaries`.
-   Removed the dynamic cache.
