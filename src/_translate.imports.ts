// In a real application this is simply:
//   export * from 'simply-translate-angular';
// It must resolve to the same copy simply-translate-angular-proxy imports (dist/translate, see tsconfig paths):
// pointing at projects/translate/src instead creates a second TranslateService class, and the proxies
// fail with "No provider for TranslateService". Run `npm run build:translate` after changing the library.
export * from 'simply-translate-angular';
