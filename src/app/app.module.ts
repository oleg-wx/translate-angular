import { BrowserModule } from '@angular/platform-browser';
import { effect, NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { MoreModule } from './more/more.module';
import { AppRoutingModule } from './app.routing';
import { AppTranslateComponent } from './translate.component';
import { SwitchLangComponent } from './switch-lang/switch-lang.component';
import { TryDirectiveComponent } from './try-directive/try-directive.component';
import { map } from 'rxjs/operators';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Dictionary, TranslateModule } from 'src/_translate.imports';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ComponentsModule } from './components/components.module';
import { TryProxyComponent } from './try-proxy/try-proxy.component';

function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.json`);
}

@NgModule({
  declarations: [AppComponent, AppTranslateComponent, SwitchLangComponent, TryDirectiveComponent, TryProxyComponent],
  imports: [
    HttpClientModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    TranslateModule.forRoot({
      deps: [HttpClient],

      lang: 'en-US',
      fallbackLang: 'en-US',

      addMiddleware: (client: HttpClient) => {
        return [
          ({ params, result }) => {
            if (result.fallingBack) {
              console.warn('falling back:', `${params.key.toString()}, [${params.lang}]`);
            }
          },
        ];
      },

      loadDictionaries: ({ lang, fallbackLang }, client: HttpClient) => {
        return forkJoin([getDictionary(lang, client), getDictionary('ru-RU', client)]).pipe(
          map(([current, fallback]) => {
            debugger;
            return { [lang]: current, 'ru-RU': fallback };
          }),
        );
      },
    }),
    AppRoutingModule,
    MoreModule,
  ],
  providers: [],
  exports: [],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor() {
    // this.translate.object.namespace.hello_user.$().subscribe();

    // this.translate.object.i_have_been_here_count.$({ count: 10 }).subscribe((res) => {
    //   console.log('Translate', res);
    // });

    // effect(() => {
    //   console.log('Signal', this.a());
    // });
  }
}
