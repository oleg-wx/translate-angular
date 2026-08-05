# Simply Translate for Angular

[Simplest translations](https://www.npmjs.com/package/simply-translate) for Angular _(tested for v10+)_.

### **Breaking changes**

#### (v0.21.20)
- per-proxy loading is now configured with the `@TranslateProxyLoader` decorator instead of implementing the `TranslateLoaderSupport` interface by hand — see [Per-proxy (`TranslateProxyLoader`)](#per-proxy-loader).
- added `onLoaderReady?(args: { lang, id })` alongside `onLoaderError?()` — fires whenever a language finishes loading successfully.
- `TranslateProxyLoader` gained a public `preloadLangs` and `preloadFallbackLang`.

#### (v0.21.10)
- `TranslateProxy<T>` now takes a schema type (`typeof yourSchema`) instead of a hand-written `Dictionary` interface — see [Use TranslateProxy](#Use-TranslateProxy).
- added schema-first dictionary definitions (`TranslateSchema`, `StringProp`, `ValueProp`, `Namespace`) and runtime validation (`validateDictionary`, `assertValidDictionary`), including placeholder-usage checks against each leaf's declared `params` — see [Validating dictionaries with a schema](#validating-dictionaries-with-a-schema).

#### (v0.21.0)

- upgraded to Angular 17.
- introduced new [`TranslateProxy`](#Use-TranslateProxy) for typed, autocompleted dictionary access.
- directive now **always** reacts to language/dictionary changes; removed the `detect` opt-in property.
- directive can infer its key from static inner text when `translate` has no value.
- fixed directive writing translated output to a fresh text node instead of updating the existing one, which broke content bound elsewhere in the same element (e.g. Angular interpolation).
- added `translateSignal` and `translateObservable` to `TranslateService`.

#### (v0.20.0)

- see [plain JS library changes](https://www.npmjs.com/package/simply-translate#Breaking-changes).
- deprecated `init` method in root import. Instead use `addMiddleware`, `loadDictionaries` and `final` methods instead.
- `lang` and `fallbackLang` now in the root import.
- added **middleware pipeline** _(see [Pipeline](#Pipeline))_.
- removed `$less` property. Instead of `$less` use `placeholder = 'single'`.
- added `fallback` property to directive.
- `defaultLang` renamed to `lang`.
- `extend` in `forChild` initialization changed to `loadDictionaries`.
- added language detection change for directives and pipes
- after initialization `lang` and `fallbackLang` can be changed only from `TranslateRootService`.
- removed **dynamic cache**.

### Basics

Please use link above to learn more about **basic interaction**, dictionaries, pluralization, cases, etc.

### Install

```javascript
npm i simply-translate-angular
```

### Import

```javascript
import { TranslateModule, TranslateService } from 'simply-translate-angular';
```

### Initialize

```javascript
@NgModule({
  declarations: [AppComponent, AppViewComponent],
  imports: [
    TranslateModule.forRoot({
      // dependencies
      deps: [ HttpClient ],
      // language
      lang: window.navigator.language,
      fallbackLang: 'ru-RU',
      // static dictionaries
      dictionaries:{'ru-RU':{...}}
      // load dictionaries
      loadDictionaries:({lang, fallbackLang}, client /* params are injected dependencies received in the same order as they are in deps */) =>{
        return {
          [lang]: {...}
        }
      }
    })
  ]
});
```

See [Load dictionaries](#Load-dictionaries)

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

Pipes are pure by default. However if application has dynamic language change you may use special _impure_ pipe (it has internal dirty check), it will detect language changes as well as pipe parameters.

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

To change language use `TranslateRootService` `lang` property.   
To detect changes subscribe on `languageChange$` and `dictionaryChange$`. **Note** that `loadDictionaries` method in root settings will not execute when language changes.

```javascript
export class Component {
  constructor(private rootTranslate: TranslateRootService){
    rootTranslate.lang = "en-US";
  }
}
```

### Use TranslateProxy

For typed, autocompleted access to your dictionary keys, describe your dictionary shape with `TranslateSchema` and extend `TranslateProxy<typeof yourSchema>`.

```typescript
// app.schema.ts
import { Namespace, NumberParam, StringParam, StringProp, TranslateSchema, ValueProp } from 'simply-translate-angular';

export const appSchema = TranslateSchema({
  hello_user: StringProp({ params: { user: StringParam } }),
  about: StringProp(),
  namespace: Namespace({
    hello_user: StringProp({ params: { user: StringParam } }),
  }),
  visit_count: ValueProp({ params: { count: NumberParam } }),
});

export type AppSchema = typeof appSchema;
```

(Named `StringProp`/`ValueProp` rather than `String`/`Value` to avoid shadowing the globals of the same name.)

```typescript
// app.translate.ts
import { Injectable } from '@angular/core';
import { TranslateProxy } from 'simply-translate-angular';
import type { AppSchema } from './app.schema';

@Injectable()
export class AppTranslate extends TranslateProxy<AppSchema> {}
```

`TranslateProxy` takes the schema itself as its type parameter — the dictionary type is inferred from it via `InferTranslateSchemaType`. `TranslateProxy` only ever needs `AppSchema`'s **type**, never `appSchema`'s runtime value, so import it with `import type`: TypeScript erases `import type` entirely at compile time, keeping the schema-building code (and everything it imports) out of your app's bundle unless something else in it also needs the actual schema object at runtime — e.g. to call `validateDictionary`. See [Validating dictionaries with a schema](#validating-dictionaries-with-a-schema) for the full builder API (`StringProp`, `ValueProp`, `Namespace`) and for validating your JSON dictionaries against the same schema at runtime.

Inject it like any other service and read keys off `object`. Every leaf key is callable (mirrors `translate`), and carries `.Signal()` / `.$()` companions that mirror `translateSignal` / `translateObservable`.

**The params each of these accepts comes entirely from how the schema leaf was declared:**

- `StringProp()` / `ValueProp()`, called with no `params` — the leaf takes **no dynamic props at all**. The call, `.Signal()`, and `.$()` all become zero-argument — passing anything is a compile error.
- `StringProp({ params: {...} })` / `ValueProp({ params: {...} })` — the leaf **requires** exactly the shape described by `params`, everywhere. Omitting the argument, passing `undefined`, or passing the wrong shape are all compile errors.

`params` is a flat map of prop name → either an actual default value (e.g. `user: 'Guest'`, `count: 0`) or, when there's no natural default, the `StringParam` / `NumberParam` markers. Either way the value is only ever used to infer that prop's type (`string`/`number`) and to read its name — nothing about it is used at runtime beyond that. Params are intentionally flat (`string`/`number` only, no nesting) to match what dynamic props can actually be.

```typescript
@Component({
  ...
})
export class MyComponent {
  constructor(private translate: AppTranslate) {
    // like translate.translate('hello_user', { user: 'Oleg' })
    this.hello = translate.object.hello_user({ user: 'Oleg' });

    // reactive Signal<string>, like translate.translateSignal(...)
    this.helloSignal = translate.object.hello_user.Signal({ user: 'Oleg' });

    // reactive Observable<string>, like translate.translateObservable(...)
    this.hello$ = translate.object.hello_user.$({ user: 'Oleg' });

    // nested keys work the same way
    this.nsHello = translate.object.namespace.hello_user({ user: 'Oleg' });

    // `about` was declared with StringProp() (no params) -> zero-argument call
    this.about = translate.object.about();
    // translate.object.about({ user: 'Oleg' });    // compile error: `about` takes no params
    // translate.object.hello_user();                // compile error: `hello_user` requires { user: string }
  }
}
```

Each key also stringifies to its full dotted path — `` `${translate.object.namespace.hello_user}` === 'namespace.hello_user' `` — useful when you need the key itself (logging, passing to another API) rather than its translation.

**Warning — dynamic props with `.Signal()` / `.$()`:** the returned `Signal`/`Observable` is cached per `dynamicProps` reference (keyed by identity, not by value). A plain object always stays reactive to **language/dictionary** changes, but is a fixed snapshot of its own properties — it will never update if you mutate the object later, and passing a fresh object literal on every call (e.g. inline in a template) defeats the cache, allocating a new `Signal`/`Observable` each time. If the dynamic values themselves change over time, pass a `Signal`/`Observable` of that same params shape instead, and keep reusing the **same** reference so the cache can pick it up:

```typescript
// reactive to changing values — pass a stable Signal/Observable reference
const params = signal({ user: 'Oleg' });
this.helloSignal = translate.object.hello_user.Signal(params);
params.set({ user: 'John' }); // helloSignal updates automatically

// static values, but still reactive to language/dictionary changes
this.helloSignal = translate.object.hello_user.Signal({ user: 'Oleg' });
```

**Restriction:** `Signal` and `$` are reserved property names — `TranslateProxy` uses them on every key to expose the reactive accessors above. A dictionary key literally named `Signal` or `$` (at any nesting level) will be shadowed by these accessors and become unreachable through `object`. Avoid naming dictionary keys `Signal` or `$`.

### Validating dictionaries with a schema

`TranslateSchema` describes a dictionary once and gives you both the static type (via `InferTranslateSchemaType`, used internally by `TranslateProxy`) and a runtime validator for your actual JSON dictionary files — so a language file that's missing a key, has an extra key, or has the wrong shape fails loudly instead of silently falling back at runtime.

Build a schema with three node builders:

- `StringProp()` — a leaf that must be a plain string.
- `ValueProp()` — a leaf that may be a string, a `DictionaryEntry` (`{ value, plural?, cases?, description? }`), or a nested dictionary.
- `Namespace({...})` — a nested dictionary with a fixed, known shape.

```typescript
import { Namespace, StringProp, TranslateSchema, ValueProp } from 'simply-translate-angular';

export const appSchema = TranslateSchema({
  welcome_to_app: StringProp(),
  goodbye_world: ValueProp(), // string, or { value, description } etc.
  namespace: Namespace({
    hello_user: ValueProp(),
  }),
});

export type AppDictionary = InferTranslateSchemaType<typeof appSchema>;
```

Validate a loaded dictionary (e.g. a parsed JSON file) against the schema:

```typescript
import { assertValidDictionary, validateDictionary } from 'simply-translate-angular';

// returns a list of { path, message } issues, empty when valid
const errors = validateDictionary(appSchema, parsedJson);

// or throw with a formatted message if invalid — handy in a startup check or a build/CI script
assertValidDictionary(appSchema, parsedJson, 'en-US.json');
```

Some keys are legitimately allowed to diverge between the schema and a given language file — a translation that isn't ready yet, or a root-only fallback key. Rather than silently ignoring every missing/extra key, list the exceptions explicitly via `allowedErrors`, keyed by the same dotted path shown in `SchemaValidationError.path`. Each entry names the kind of error tolerated there — `'missing'`, `'orphan'`, `'params'`, or `'any'` (whichever check applies) — either as a bare string, or as `{ kind, reason? }` if you want to document why:

```typescript
const errors = validateDictionary(appSchema, parsedJson, {
  allowedErrors: {
    'namespace.hello_user': { kind: 'missing', reason: 'translation pending, falls back to en-US' },
    only_root_key: 'orphan', // root-only fallback key, intentionally absent from other languages
  },
});
```

The kind has to match the check that would otherwise fire at that path — allowing `'orphan'` on a path that's actually reported as `'missing'` still errors. `'params'` is blanket per-path: it silences every placeholder mismatch at that key (see [Placeholder validation](#placeholder-validation)), not individual param names.

A key ending in `.*` allows a whole namespace at once, instead of enumerating every leaf under it — `'namespace.*'` matches `namespace` itself and everything nested under it:

```typescript
validateDictionary(appSchema, parsedJson, {
  allowedErrors: { 'namespace.*': 'missing' }, // an entire namespace not translated yet for this language
});
```

#### Placeholder validation

When a leaf declares `params` (see [Use TranslateProxy](#Use-TranslateProxy)), `validateDictionary` also checks that every declared param actually shows up as a `${name}` placeholder somewhere in the translation — and flags any placeholder that *isn't* declared. "Somewhere" covers the leaf's `value` as well as every `plural`/`cases` result string, since `simply-translate` re-scans a chosen plural/case result for further placeholders:

```typescript
const appSchema = TranslateSchema({
  hello_user: StringProp({ params: { user: StringParam } }),
  about: StringProp(),
});

validateDictionary(appSchema, { hello_user: 'Hello there', about: 'Welcome' });
// [{ path: ['hello_user'], message: 'missing placeholder for param "user"' }]

validateDictionary(appSchema, { hello_user: 'Hello ${user}!', about: 'Welcome, ${name}!' });
// [{ path: ['about'], message: 'unexpected placeholder "name", not declared in schema params' }]
```

If your app uses a non-default `placeholder` style (`'single'` `{user}` / `'double'` `{{user}}`, see [`TranslateModule.forRoot`](#Initialize)), pass the same value so the checks recognize the right syntax:

```typescript
validateDictionary(appSchema, parsedJson, { placeholder: 'single' });
```

### Load dictionaries

#### Root

Default `forRoot` initialization allows to use injected dependencies (e.g. `HttpClient`) to fetch dictionaries. It returns `Observable` that contains set of dictionaries

```javascript
export function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.json`);
}

@NgModule({
  declarations: [...],
  imports: [
    ...
    TranslateModule.forRoot({
      // dependencies
      deps: [ HttpClient ],

      lang: window.navigator.language,
      fallbackLang: 'ru-RU',

      loadDictionaries: ({lang, fallbackLang}, client /* params are injected dependencies received in the same order as they are in deps */) => {

        const res$ = forkJoin([getDictionary(lang, client), getDictionary(fbLang, client)]).pipe(
          map((res) => {
            return { [lang]: res[0], fbLang: res[1] };
          })
        );

        return res$;
      },
    }),
    ...
  ],
  ...
})
```

**Note**: it is might be useful to **hardcode** _fallback dictionary_ in .ts or .json file then import it rather then use http client to download.

```javascript
import fallback from './translations/fallback';

TranslateModule.forRoot({
  lang: window.navigator.language,
  fallbackLang: env.fallbackLanguage,
  dictionaries: {
    [env.fallbackLanguage]: fallback,
  },

  deps: [ HttpClient ],
  loadDictionaries: ({lang, fallbackLang}, client /* params are injected dependencies received in the same order as they are in deps */) => {
    return getDictionary(lang, client).pipe(
      map((res) => {
        return { [lang]: res };
      })
    );
  },
}),
```

**Note**: For more complex scenarios you may use initialization functions with `APP_INITIALIZER` token.

#### Lazy

Load dictionaries for **Lazy** modules a bit trickier.

```javascript
export function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.dynamic.json`);
}

@NgModule({
  declarations: [...],
  imports: [
    TranslateModule.forChild({
      deps: [ HttpClient ],
      loadDictionaries: ({ lang, fallbackLang }, client: HttpClient) => {
        return forkJoin([getDictionary(lang, client), getDictionary(fallbackLang, client)]).pipe(
          map((res) => {
            return { [lang]: res[0], [fallbackLang]: res[1] };
          })
        );
      },
    }),
    ...
  ]
})
export class DynamicModule {}
```

Then you **must** use resolver `TranslateResolve` to every lazy component to wait for child `loadDictionaries`.

```javascript
const routes: Routes = [{ path: '', component: DynamicComponent, resolve: { translate: TranslateResolve } }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DynamicRoutingModule {}
```

**Deprecated: Under consideration of removing**: For rare cases you may use `id` parameter for Lazy loaded module, that allows having different values with same key.  
"Lazy" values will be available only for lazy modules with that special `id`.

```javascript
@NgModule({
  declarations: [...],
  imports: [
    TranslateModule.forRoot({
      dictionaries: {'en-US':{
        'key':'Value'
      }}
    })
  ]
})
```

```javascript
@NgModule({
  declarations: [...],
  imports: [
    TranslateModule.forChild({
      id: 'lazy'
      dictionaries: {'en-US':{
        'key':'Value for Lazy'
      }}
    })
  ]
})
```

#### Per-proxy (`per-proxy-loader`)

A `TranslateProxy` subclass can load its own per-language dictionary, without any `forChild()`/`NgModule` wrapper — each language may be a plain object, a `Promise`, an `Observable`, or a URL string fetched via `HttpClient`. Only the *active* language loads eagerly by default; anything else loads on demand the first time you switch to it, unless you ask for it upfront via `preloadLangs`/`preloadFallbackLang`, or on demand via `preloadLang()`. Configure it with the `@TranslateProxyLoader(config)` decorator:

```typescript
import { Injectable } from '@angular/core';
import { TranslateProxy, TranslateProxyLoader } from 'simply-translate-angular';
import type { AppSchema } from './app.schema';

@Injectable({ providedIn: 'root' })
@TranslateProxyLoader({
  id: 'app',
  dictionaries: {
    // dynamic import() — code-split into its own lazy chunk, fetched when this proxy is first constructed
    'en-US': import('./translations/en-US.json').then((m) => m.default),
    // URL string — fetched via HttpClient the first time this language becomes active
    'ru-RU': '/assets/translations/ru-RU.json',
  },
  preloadFallbackLang: true, // also load `service.fallbackLang` upfront, not just the active language
})
export class AppTranslate extends TranslateProxy<AppSchema> {
  // optional — fires whenever a language finishes loading successfully
  onLoaderReady({ lang, id }: { lang: string; id: string }): void {
    console.log(`Loaded '${id}' (${lang})`);
  }

  // optional — fires whenever a language fails to load; omit it and failures stay silent
  onLoaderError({ lang, id, error }: { lang: string; id: string; error: unknown }): void {
    console.error(`Failed to load '${id}' (${lang})`, error);
  }
}
```

Beyond `preloadLangs`/`preloadFallbackLang`, call the proxy's own `preloadLang(lang)` whenever you want a language warmed up ad hoc (e.g. a language the user is likely to switch to next) — it's a no-op if the proxy has no dictionary entry for `lang`:

```typescript
appTranslate.preloadLang('de-DE');
```

**Caveat:** unlike `forChild()`'s `id`-based key prefixing, this does not namespace keys — every proxy's dictionary is merged flat into the same per-language dictionary. If more than one proxy loads its own dictionary, wrap each one's own schema in a top-level `Namespace({...})` (named after that feature) to avoid colliding with another proxy's keys.

##### Sharing a dictionary between proxies (`extends`)

`@TranslateProxyLoader`'s real value beyond being declarative is `extends` — sharing one proxy's dictionary with another, so common strings (`ok`, `no`, generic labels, ...) don't have to be redeclared and reloaded by every feature that needs them:

```typescript
import { StringProp, TranslateSchema } from 'simply-translate-angular';

const commonSchema = TranslateSchema({ ok: StringProp(), no: StringProp() });

@Injectable({ providedIn: 'root' })
@TranslateProxyLoader({ id: 'common', dictionaries: { 'en-US': { ok: 'Ok', no: 'No' } } })
export class CommonTranslate extends TranslateProxy<typeof commonSchema> {}

// spread the shared shape in — schemas are plain objects, so this is ordinary composition (see
// [Validating dictionaries with a schema](#validating-dictionaries-with-a-schema)), nothing `extends`-specific
const featureSchema = TranslateSchema({ ...commonSchema.shape, title: StringProp() });

@Injectable({ providedIn: 'root' })
@TranslateProxyLoader({
  id: 'feature',
  extends: [CommonTranslate],
  dictionaries: { 'en-US': { title: 'Title' } },
})
export class FeatureTranslate extends TranslateProxy<typeof featureSchema & typeof commonSchema> {}
```

Injecting `FeatureTranslate` alone is enough — `feature.object.ok` and `feature.object.title` both resolve, without ever injecting `CommonTranslate` anywhere. `extends` takes **class references**, forces to actually `inject` that class.

Two things `extends` does *not* do: it doesn't derive `FeatureTranslate`'s schema type for you (spread the shape in by hand, as above — `extends` only affects runtime loading), and it doesn't forward `CommonTranslate`'s own `onLoaderReady`/`onLoaderError` to `FeatureTranslate`, `extends` never constructs a `CommonTranslate` instance of its own beyond what DI already gives you.

### Pipeline

**(experimental)**
Currently it is possible to **append** middleware to the end of translation pipeline.  
It might be specially useful to add **logger** or rarely fine-tune translation result.

```javascript
@NgModule({
  declarations: [...],
  imports: [
    ...
    TranslateModule.forRoot({
      // dependencies
      deps: [ Logger ],
      addMiddleware: (logger /* injected dependencies */) => {
       return [
          ({params, result}, next) => {
            if (result.fallingBack) {
              logger.log(`Translation absent [${params.lang}:${params.key}]`);
            }
            next();
          },
        ];
      },
    }),
    ...
  ],
  ...
})
```
