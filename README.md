# Simply Translate for Angular

[Simplest translations](https://www.npmjs.com/package/simply-translate) for Angular _(tested for v10+)_.

### **Breaking changes**

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

Please use link above to learn more about basic interaction, dictionaries, etc.

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
        TranslateModule.forRoot(...)
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
<!-- please not that Angular does not like when we use "{" in templates so rather use property in such cases or replace it with $&#123; (and optionally closing bracket with $&#125;) or escape it somehow :) -->
<h2 translate="hello_user_not_there" [values]="{ user: 'Oleg' }">Hello $&#123;user}</h2>
<h2 translate="hello_user_not_there" [values]="{ user: 'Oleg' }" fallback="Hello ${user}"></h2>
```

Directives can detect language change, but it is not by default. Use _[detect]_ property.

```html
<!-- use default language -->
<h2 translate="hello_user" to="ru-RU" [values]="{ user: 'Oleg' }" detect></h2>
```

Directive can use inner text as a fallback.

### Use Pipe

```html
<!-- use default language -->
<h2>{{ 'hello_user' | translate: { user: 'Oleg' } }}</h2>
<!-- use other language -->
<h2>{{ 'hello_user' | translateTo: 'ru-RU': { user: 'Oleg' } }}</h2>
<!-- use fallback -->
<h2>{{ 'hello_user_not_there' | translate: { user: 'Oleg' } : 'Hello ${user}'}}</h2>
```

Pipes are pure by default. However if application has dynamic language change you may use special _impure_ directive (it has internal dirty check), it will detect language changes as well as pipe parameters.

```html
<!-- use default language -->
<h2>{{ 'hello_user' | translate$: { user: 'Oleg' } }}</h2>
```

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

To change language use `TranslateRootService` `lang` property.

```javascript
export class Component {
  constructor(private rootTranslate: TranslateRootService){
    rootTranslate.lang = "en-US";
  }
}
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

**Note**: it is probably useful to **hardcode** _fallback dictionary_ in .ts or .json file then import it rather then use http client to download.

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

You may subscribe on `languageChange$` and `dictionaryChange$` if needed. **Note** that `loadDictionaries` will not execute when language changes.

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

For rare cases you may use `id` parameter for Lazy loaded module, that allows having different values with same key.  
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
