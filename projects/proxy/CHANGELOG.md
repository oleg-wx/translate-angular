# Changelog

All notable changes to `simply-translate-angular-proxy` are listed here.

## 1.0.0 (unreleased)

First release as a separate package. The API moved here unchanged from `simply-translate-angular` 0.21.20. For earlier history see the [`simply-translate-angular` changelog](https://github.com/oleg-wx/translate-angular/blob/master/projects/translate/CHANGELOG.md).

### Upgrading from simply-translate-angular 0.21.x

1. `npm i simply-translate-angular-proxy`
2. Change imports of `TranslateProxy`, `TranslateProxyLoader`, `TranslateSchema`, `StringProp`, `ValueProp`, `Namespace`, `StringParam`, `NumberParam`, `StringNullableParam`, `NumberNullableParam`, `translateLoaderResolver`, `InferTranslateSchemaType`, `validateDictionary` and `assertValidDictionary` from `simply-translate-angular` to `simply-translate-angular-proxy`.
