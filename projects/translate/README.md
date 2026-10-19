# Simply Translate for Angular

[Simplest translations](https://www.npmjs.com/package/simply-translate) for Angular 20+.

Upgrading or looking for what changed? See the [changelog](CHANGELOG.md). Version 1.0.0 moved `TranslateProxy` and the schema API to [simply-translate-angular-proxy](https://www.npmjs.com/package/simply-translate-angular-proxy).

### Versions

The major version follows Angular's: 20.x needs Angular 20 or later. For Angular 19 use 19.x, and for Angular 17–18 use 1.x.

### Basics

Please use the [simply-translate](https://www.npmjs.com/package/simply-translate) docs to learn more about **basic interaction**, dictionaries, pluralization, cases, etc.

### Install

```javascript
npm i simply-translate-angular
```

### Import

```javascript
import { provideTranslate, TranslateService, TRANSLATE_IMPORTS } from 'simply-translate-angular';
```

### Initialize

`provideTranslate()` goes into the application providers. Everything optional is passed as a *feature* (`withLoader`, `withMiddleware`, …), and every feature callback runs inside an injection context, so dependencies are taken with `inject()`.

```javascript
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideTranslate(
      {
        lang: window.navigator.language,
        fallbackLang: 'ru-RU',
      },
      // static dictionaries, available before anything loads
      withDictionaries({ 'ru-RU': { ... } }),
      // dictionaries fetched while the application initializes
      withLoader(({ lang }) => inject(HttpClient).get<Dictionary>(`/assets/translations/${lang}.json`).pipe(
        map((dictionary) => ({ [lang]: dictionary })),
      )),
    ),
  ],
});
```

Declarables are standalone. Add `TRANSLATE_IMPORTS` (the three pipes and the directive) to any component that translates:

```javascript
@Component({
  imports: [TRANSLATE_IMPORTS],
  template: `<h2 translate="hello_user" [values]="{ user: 'Oleg' }"></h2>`,
})
export class HelloComponent {}
```

Import them individually (`TranslatePipe`, `TranslateToPipe`, `TranslatePipeDetect`, `TranslateDirective`) when a component needs only some.

Using NgModules? `TranslateModule.forRoot()` / `.forChild()` still work — see [Legacy NgModule API](#legacy-ngmodule-api).

See [Load dictionaries](#load-dictionaries)

### Use Directive

```html
<!-- use default language -->
<h2 translate="hello_user" [values]="{ user: 'Oleg' }"></h2>
<!-- use other language -->
<h2 translate="hello_user" to="ru-RU" [values]="{ user: 'Oleg' }"></h2>
<!-- use fallback -->
<h2 translate="hello_user_not_there" [values]="{ user: 'Oleg' }">Hello user</h2>
<!-- please note that Angular uses curly-braces in templates as well, so prefer use fallback property or replace open bracket with $&#123; (and optionally closing bracket with &#125;) -->
<h2 translate="hello_user_not_there" [values]="{ user: 'Oleg' }">Hello $&#123;user&#125;</h2>
<!-- preferred fallback property usage -->
<h2 translate="hello_user_not_there" [values]="{ user: 'Oleg' }" fallback="Hello ${user}"></h2>
```

Directives always react to language and dictionary changes automatically, no opt-in needed.

Directive can also use inner text as an implicit key (when `translate` has no value) or as a fallback (when the key is missing) — but only for **static** content; dynamic keys must be bound with `[translate]="expr"`.

### Use Pipe

```html
<h2>{{ 'hello_user' | translate: { user: 'Oleg' } }}</h2>
<!-- use other language -->
<h2>{{ 'hello_user' | translateTo: 'ru-RU': { user: 'Oleg' } }}</h2>
<!-- use fallback -->
<h2>{{ 'hello_user_not_there' | translate: { user: 'Oleg' } : 'Hello ${user}'}}</h2>
```

Pipes are pure by default. However, if the application changes language at runtime you may use the special _impure_ pipe (it has internal dirty check), it will detect language changes as well as pipe parameters.

```html
<h2>{{ 'hello_user' | translate$: { user: 'Oleg' } }}</h2>
```

`translate$` is cheap despite being impure: it caches the last language/dictionary version and arguments, and only re-translates when one of them actually changed — not on every check.

### Use Service

```javascript
@Component({
    ...
})
export class Component {
    hello: string;
    constructor(private translate: TranslateService) {
        // use default language
        this.hello = translate.translate('hello_user', { user: 'Oleg' })
        // use other language
        this.hello = translate.translateTo('ru-RU','hello_user', { user: 'Oleg' })
        // use fallback
        this.hello = translate.translateTo('ru-RU','hello_user_not_there', { user: 'Oleg' }, 'Hello ${user}')
    }
}
```

`translateSignal` and `translateObservable` mirror `translate`'s overloads but return a reactive `Signal<string>` / `Observable<string>` that updates on language or dictionary changes.

```javascript
helloSignal = translate.translateSignal('hello_user', { user: 'Oleg' }); // Signal<string>
hello$ = translate.translateObservable('hello_user', { user: 'Oleg' }); // Observable<string>
```

To change language, use `TranslateRootService` `lang` property.   
To detect changes, subscribe to `languageChange$` and `dictionaryChange$`. **Note** that root loaders (`withLoader()`) run once during initialization and will not execute again when the language changes.

```javascript
export class Component {
  constructor(private rootTranslate: TranslateRootService){
    rootTranslate.lang = "en-US";
  }
}
```

### Load dictionaries

#### Root

`withLoader()` fetches dictionaries during application initialization; the application does not start until they settle. It may return an `Observable`, a `Promise` or a plain `Dictionaries` object, and it runs inside an injection context.

```javascript
function getDictionary(lang: string) {
  return inject(HttpClient).get<Dictionary>(`/assets/translations/${lang}.json`);
}

provideTranslate(
  {
    lang: window.navigator.language,
    fallbackLang: 'ru-RU',
  },
  withLoader(({ lang, fallbackLang }) =>
    forkJoin([getDictionary(lang), getDictionary(fallbackLang)]).pipe(
      map(([dictionary, fallback]) => ({ [lang]: dictionary, [fallbackLang]: fallback })),
    ),
  ),
);
```

`withLoader()` may be used several times — the loaders run in parallel and their dictionaries are merged, which lets a feature contribute its own without touching the bootstrap config.

**Note**: it might be useful to **hardcode** the _fallback dictionary_ in a .ts or .json file and import it rather than use the http client to download it.

```javascript
import fallback from './translations/fallback';

provideTranslate(
  {
    lang: window.navigator.language,
    fallbackLang: env.fallbackLanguage,
  },
  withDictionaries({ [env.fallbackLanguage]: fallback }),
  withLoader(({ lang }) => getDictionary(lang).pipe(map((res) => ({ [lang]: res })))),
);
```

`withOnReady()` runs once every loader has settled, before the application starts:

```javascript
provideTranslate(
  { lang: window.navigator.language },
  withLoader(...),
  withOnReady(() => inject(SplashScreen).hide()),
);
```

#### Lazy routes

A route scopes translation with `provideTranslateChild()` in its `providers`, plus `translateChildResolver` in its `resolve` so navigation waits for the dictionaries. `withTranslateChild()` is the two of them in one object, ready to spread into the route:

```javascript
const routes: Routes = [
  {
    path: 'dynamic',
    ...withTranslateChild({
      loadDictionaries: ({ lang, fallbackLang }) =>
        forkJoin([getDictionary(lang), getDictionary(fallbackLang)]).pipe(
          map(([dictionary, fallback]) => ({ [lang]: dictionary, [fallbackLang]: fallback })),
        ),
    }),
    loadComponent: () => import('./dynamic.component').then((m) => m.DynamicComponent),
  },
];
```

Spelled out, that is:

```javascript
{
  path: 'dynamic',
  providers: [provideTranslateChild({ loadDictionaries })],
  resolve: { translate: translateChildResolver },
  loadComponent: ...,
}
```

Components under that route get their own `TranslateService` instance; everywhere else keeps the root one.

**Deprecated: under consideration for removal**: the `id` parameter gives a scope its own values for keys that already exist at the root. Those values are visible only inside that scope, and keys the scope does not define fall back to the root dictionary.

```javascript
provideTranslate({ lang: 'en-US' }, withDictionaries({ 'en-US': { key: 'Value' } }));
```

```javascript
{
  path: 'lazy',
  ...withTranslateChild({ id: 'lazy', dictionaries: { 'en-US': { key: 'Value for Lazy' } } }),
  loadComponent: ...,
}
```

### Pipeline

**(experimental)**
Currently it is possible to **append** middleware to the end of the translation pipeline.  
It might be especially useful to add a **logger** or to rarely fine-tune the translation result.

```javascript
provideTranslate(
  { lang: window.navigator.language },
  withMiddleware(() => {
    const logger = inject(Logger);
    return [
      ({ params, result }, next) => {
        if (result.fallingBack) {
          logger.log(`Translation absent [${params.lang}:${params.key}]`);
        }
        next();
      },
    ];
  }),
);
```

Middleware is appended before any loader runs, so it sees every dictionary as it arrives.

### Legacy NgModule API

`TranslateModule.forRoot()` and `TranslateModule.forChild()` are deprecated but still supported — they build the same providers as `provideTranslate()` and `provideTranslateChild()`. Importing `TranslateModule` into an NgModule still exports the pipes and the directive to its declarations.

```javascript
@NgModule({
  declarations: [AppComponent],
  imports: [
    TranslateModule.forRoot({
      // dependencies, resolved and passed to every callback below
      deps: [HttpClient],
      lang: window.navigator.language,
      fallbackLang: 'ru-RU',
      dictionaries: { 'ru-RU': { ... } },
      loadDictionaries: ({ lang, fallbackLang }, client) => of({ [lang]: { ... } }),
    }),
  ],
})
export class AppModule {}
```

Lazy NgModules use `TranslateModule.forChild()` and need `TranslateResolve` on every route that waits for its dictionaries:

```javascript
const routes: Routes = [{ path: '', component: DynamicComponent, resolve: { translate: TranslateResolve } }];
```

To migrate:

| Legacy | Functional |
| --- | --- |
| `TranslateModule.forRoot(config)` | `provideTranslate(config, ...features)` |
| `TranslateModule.forChild(config)` | `provideTranslateChild(config)` in `Route.providers` |
| `TranslateResolve` | `translateChildResolver` |
| `deps: [Dep]` + callback parameters | `inject(Dep)` inside the callback |
| `dictionaries` | `withDictionaries()` |
| `loadDictionaries` | `withLoader()` |
| `addMiddleware` | `withMiddleware()` |
| `final` | `withOnReady()` |
| `init` | `withLoader()` |
| `imports: [TranslateModule]` | `imports: [TRANSLATE_IMPORTS]` |
