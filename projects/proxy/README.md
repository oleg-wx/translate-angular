# Simply Translate Proxy for Angular

Typed, autocompleted access to [simply-translate-angular](https://www.npmjs.com/package/simply-translate-angular) dictionaries, schema-based dictionary validation, and per-proxy dictionary loading.

See the [changelog](CHANGELOG.md) for release notes. Before 1.0.0 this API shipped inside `simply-translate-angular`.

### Install

```bash
npm i simply-translate-angular simply-translate-angular-proxy
```

`TranslateProxy` uses `TranslateService` from `simply-translate-angular`, so set up `TranslateModule.forRoot(...)` as described in the [simply-translate-angular README](https://www.npmjs.com/package/simply-translate-angular#initialize) first.

### Use TranslateProxy

For typed, autocompleted access to your dictionary keys, describe your dictionary shape with `TranslateSchema` and extend `TranslateProxy<typeof yourSchema>`.

```typescript
// app.schema.ts
import { Namespace, NumberParam, StringParam, StringProp, TranslateSchema, ValueProp } from 'simply-translate-angular-proxy';

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
import { TranslateProxy } from 'simply-translate-angular-proxy';
import type { AppSchema } from './app.schema';

@Injectable()
export class AppTranslate extends TranslateProxy<AppSchema> {}
```

`TranslateProxy` takes the schema itself as its type parameter — the dictionary type is inferred from it via `InferTranslateSchemaType`. `TranslateProxy` only ever needs `AppSchema`'s **type**, never `appSchema`'s runtime value, so import it with `import type`: TypeScript erases `import type` entirely at compile time, keeping the schema-building code (and everything it imports) out of your app's bundle unless something else in it also needs the actual schema object at runtime — e.g. to call `validateDictionary`. See [Validating dictionaries with a schema](#validating-dictionaries-with-a-schema) for the full builder API (`StringProp`, `ValueProp`, `Namespace`) and for validating your JSON dictionaries against the same schema at runtime.

Inject it like any other service and read keys off `object`. Every leaf key is callable (mirrors `translate`), and carries `.Signal()` / `.$()` companions that mirror `translateSignal` / `translateObservable`.

**The params each of these accepts comes entirely from how the schema leaf was declared:**

- `StringProp()` / `ValueProp()`, called with no `params` — the leaf takes **no dynamic props at all**. The call, `.Signal()`, and `.$()` all become zero-argument — passing anything is a compile error.
- `StringProp({ params: {...} })` / `ValueProp({ params: {...} })` — the leaf **requires** exactly the shape described by `params`, everywhere. Omitting the argument, passing `undefined`, or passing the wrong shape are all compile errors.

`params` is a flat map of prop name → either an actual default value (e.g. `user: 'Guest'`, `count: 0`) or, when there's no natural default, the `StringParam` / `NumberParam` markers (`StringNullableParam` / `NumberNullableParam` also accept `null`). Either way the value is only ever used to infer that prop's type (`string`/`number`) and to read its name — nothing about it is used at runtime beyond that. Params are intentionally flat (`string`/`number` only, no nesting) to match what dynamic props can actually be.

```typescript
@Component({
  ...
})
export class MyComponent {
  constructor(protected translate: AppTranslate) {
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
    this.userData = signal({ user: 'Oleg' });
  }
}
```

```html
<div>{{ helloSignal() }}</div>
<div>{{ translate.object.hello_user.Signal(userData)() }}</div>
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
import { InferTranslateSchemaType, Namespace, StringProp, TranslateSchema, ValueProp } from 'simply-translate-angular-proxy';

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
import { assertValidDictionary, validateDictionary } from 'simply-translate-angular-proxy';

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

When a leaf declares `params` (see [Use TranslateProxy](#use-translateproxy)), `validateDictionary` also checks that every declared param actually shows up as a `${name}` placeholder somewhere in the translation — and flags any placeholder that *isn't* declared. "Somewhere" covers the leaf's `value` as well as every `plural`/`cases` result string, since `simply-translate` re-scans a chosen plural/case result for further placeholders:

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

If your app uses a non-default `placeholder` style (`'single'` `{user}` / `'double'` `{{user}}`, see [`TranslateModule.forRoot`](https://www.npmjs.com/package/simply-translate-angular#initialize)), pass the same value so the checks recognize the right syntax:

```typescript
validateDictionary(appSchema, parsedJson, { placeholder: 'single' });
```
### Per-proxy dictionary loading

A `TranslateProxy` subclass can load its own per-language dictionary, without any `forChild()`/`NgModule` wrapper — each language may be a plain object, a `Promise`, an `Observable`, or a URL string fetched via `HttpClient`. Only the *active* language loads eagerly by default; anything else loads on demand the first time you switch to it, unless you ask for it upfront via `preloadLangs`/`preloadFallbackLang`, or on demand via `preloadLang()`. Configure it with the `@TranslateProxyLoader(config)` decorator:

```typescript
import { Injectable } from '@angular/core';
import { TranslateProxy, TranslateProxyLoader } from 'simply-translate-angular-proxy';
import type { AppSchema } from './app.schema';

@Injectable({ providedIn: 'root' })
@TranslateProxyLoader({
  id: 'app',
  dictionaries: {
    // dynamic import() — code-split into its own chunk; decorator arguments run when the class is defined,
    // so the chunk starts loading as soon as this file is loaded, not when the proxy is first injected
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

#### Sharing a dictionary between proxies (`extends`)

`@TranslateProxyLoader`'s real value beyond being declarative is `extends` — sharing one proxy's dictionary with another, so common strings (`ok`, `no`, generic labels, ...) don't have to be redeclared and reloaded by every feature that needs them:

```typescript
import { StringProp, TranslateSchema } from 'simply-translate-angular-proxy';

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

Injecting `FeatureTranslate` alone is enough — `feature.object.ok` and `feature.object.title` both resolve, without ever injecting `CommonTranslate` anywhere. `extends` takes **class references**, and the decorator `inject`s each one, so it is constructed and loads its dictionary.

Two things `extends` does *not* do: it doesn't derive `FeatureTranslate`'s schema type for you (spread the shape in by hand, as above — `extends` only affects runtime loading), and it doesn't forward `CommonTranslate`'s own `onLoaderReady`/`onLoaderError` to `FeatureTranslate`, `extends` never constructs a `CommonTranslate` instance of its own beyond what DI already gives you.

#### Waiting for a dictionary in a route (`translateLoaderResolver`)

Per-proxy loading is asynchronous, so a component may render before its proxy's dictionary for the current language has arrived. To hold the route until it has, add `translateLoaderResolver(id)` with the same `id` as the proxy's `@TranslateProxyLoader` config:

```typescript
import { translateLoaderResolver } from 'simply-translate-angular-proxy';

const routes: Routes = [
  { path: 'feature', component: FeatureComponent, resolve: { translate: translateLoaderResolver('feature') } },
];
```

The resolver only waits for a load that has already started, so the proxy must have been constructed before navigation (e.g. `providedIn: 'root'` and injected by a parent component or service). If nothing has started loading, it resolves immediately.
