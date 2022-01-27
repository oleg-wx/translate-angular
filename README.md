# Simply Translate for Angular

[Simplest translations](https://www.npmjs.com/package/simply-translate) for Angular _(tested for v10+)_.

### Basics

You can learn by looking at package for plain JS on the link above.

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
<!-- use default language from service -->
<h2 translate="hello_user" [values]="{ user: 'Oleg' }"></h2>
<!-- use other language -->
<h2 translate="hello_user" to="ru-RU" [values]="{ user: 'Oleg' }"></h2>
<!-- use fallback -->
<!-- please not that Angular does not like when we use "{" in templates so tou need to replace it with $&#123; (optionally closing bracket with $&#125;) or escape it somehow :) -->
<h2 translate="hello_user_not_there" [values]="{ user: 'Oleg' }">Hello $&#123;user}</h2>
<!-- use simpler fallback -->
<h2 translate="hello_user_not_there" [values]="{ user: 'Oleg' }">Hello user</h2>
```
In this case as a fallback we use element text.

### Use Pipe

```html
<!-- use default language from service -->
<h2>{{ 'hello_user' | translate: { user: 'Oleg' } }}</h2>
<!-- use other language -->
<h2>{{ 'hello_user' | translateTo: 'ru-RU': { user: 'Oleg' } }}</h2>
<!-- use fallback -->
<h2>{{ 'hello_user_not_there' | translate: { user: 'Oleg' } : 'Hello ${user}'}}</h2>
```

### Use Service

```javascript
@Component({
    ...
})
export class Component {
    hello: string;
    constructor(private translate: TranslateService) {
        // use default language from service
        this.hello = translate.translate('hello_user', { user: 'Oleg' })
        // use other language
        this.hello = translate.translateTo('ru-RU','hello_user', { user: 'Oleg' })
        // use fallback
        this.hello = translate.translateTo('ru-RU','hello_user_not_there', { user: 'Oleg' }, 'Hello ${user}')
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
      deps: [HttpClient],
      init: (service, client) => {
        const lang = window.navigator.language;
        const fbLang = 'ru-RU';

        service.defaultLang = lang;
        service.fallbackLang = fbLang;

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
You may subscribe on `languageChange$` and `dictionaryChange$` if needed.  

For more complex scenarios you may use initialization functions and `APP_INITIALIZER` token.  

#### Lazy
Load dictionaries for **Lazy** modules a bit trickier.   
You have to *extend* dictionaries *(same keys with be replaced with latest added)*.
First load dynamic dictionaries in the same (almost) as for root.
```javascript
export function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.dynamic.json`);
}

@NgModule({
  declarations: [...],
  imports: [
    TranslateModule.forChild({
      deps: [HttpClient],
      extend: (service: TranslateService, client: HttpClient) => {
        return forkJoin([getDictionary(service.defaultLang, client), getDictionary(service.fallbackLang, client)]).pipe(
          map((res) => {
            return { [service.defaultLang]: res[0], [service.fallbackLang]: res[1] };
          })
        );
      },
    }),
    ...
  ]
})
export class DynamicModule {}
```
Then resolve them with special `TranslateResolve` resolver that has to be added to every lazy component.
```javascript
const routes: Routes = [
  { path: '', component: DynamicComponent, resolve: { translate: TranslateResolve } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DynamicRoutingModule {}
```
