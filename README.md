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
        TranslateModule.forRoot((service:TranslateService) => {
            // set default language to use .translate method and translate pipe
            service.defaultLang = window.navigator.language;
            service.fallbackLang = 'en-US';
            service.extendDictionary('en-US', {
                'hello_world':'Hello World',
                'hello_user':'Hello ${user}',
                ...
            });
        })
    ],
    providers: [
        TranslateService
    ],
});
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
    }
}
```

### Use Pipe

```html
<!-- use default language from service -->
<h2>{{ 'hello_user' | translate: { user: 'Oleg' } }}</h2>
<!-- use other language -->
<h2>{{ 'hello_user' | translateTo: 'ru-RU': { user: 'Oleg' } }}</h2>
```

### Load dictionaries

Default `forRoot` initialization allows to use http client to fetch dictionaries. It returns Promise for application initialization

```javascript
@NgModule({
    declarations: [AppComponent, AppViewComponent],
    imports: [
        HttpClientModule,
        TranslateModule.forRoot((service:TranslateService, client:) => {
            // set default language to use .translate method and translate pipe
            service.defaultLang = 'en-US';
            service.fallbackLang = 'en-US';
            return client.get<any>(`https://my-translations.com/${lang}`).pipe(
                map((res) => {
                    service.defaultLang = 'en-US';
                    service.extendDictionary('en-US', res);
                })
            ).toPromise();
            // don't forget to load fallback translations
        })
    ],
    providers: [
        TranslateService
    ],
});
```

For more complex scenarios you may use initialization functions and `APP_INITIALIZER` token.  
To extend dictionary with new values for lazy modules you may think of using __Angular Resolvers__.
