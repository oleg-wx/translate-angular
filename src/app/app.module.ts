import { TranslateModule } from 'simply-translate-angular';
//import { TranslateModule } from 'projects/translate/src/simply-translate.module';
import { Dictionary } from 'simply-translate';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { MoreModule } from './more/more.module';
import { AppRoutingModule } from './app.routing';
import { AppViewComponent } from './view.component';
import { map } from 'rxjs/operators';
import { HttpClient, HttpClientModule } from '@angular/common/http';

function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.json`);
}

@NgModule({
  declarations: [AppComponent, AppViewComponent],
  imports: [
    HttpClientModule,
    BrowserModule,
    TranslateModule.forRoot({
      deps: [HttpClient],

      lang: 'en-US',
      fallbackLang: 'ru-RU',

      addMiddleware: (client: HttpClient) => {
        return [
          (context) => {
            if (context.result.fallingBack) {
              console.warn('falling back', context.params.key, context.params.lang);
            }
          },
        ];
      },

      loadDictionaries: ({ lang, fallbackLang }, client: HttpClient) => {
        return getDictionary(lang, client).pipe(
          map((res) => {
            return { ['en-US']: res };
          })
        );
      },

      // init: (service, client: HttpClient) => {
      //   const res$ = getDictionary('ru-RU', client).pipe(
      //     map((res) => {
      //       return { 'ru-RU': res };
      //     })
      //   );
      //   return res$;
      // },

      // final: (service, client: HttpClient) => {
      //   console.warn(service);
      // },
    }),
    AppRoutingModule,
    MoreModule,
  ],
  providers: [],
  exports: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
