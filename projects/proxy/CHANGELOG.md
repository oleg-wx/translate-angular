# Changelog

All notable changes to `simply-translate-angular-proxy` are listed here.

## 21.0.0 (unreleased)

### Breaking

-   Requires Angular 21, TypeScript 5.9 and `simply-translate-angular` 21.0.0. For Angular 20 use 20.x of both packages.
-   `simply-translate-angular` 21 no longer has `TranslateModule`, so set up `TranslateService` with `provideTranslate()`.

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
