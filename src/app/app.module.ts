import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
//import { TranslateModule } from 'projects/translate/src/simply-translate.module';
import { TranslateModule, TranslateService } from 'simply-translate-angular';
import { MoreModule } from './more/more.module';
import { AppRoutingModule } from './app.routing';
import { AppViewComponent } from './view.component';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Dictionary } from 'simply-translate';

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
      init: (service, client) => {
        let lang = 'en-US'; // window.navigator.language;
        service.defaultLang = lang;
        service.fallbackLang = 'ru-RU';
        const res$ = forkJoin([getDictionary(lang, client), getDictionary('ru-RU', client)]).pipe(
          map((res) => {
            return { [lang]: res[0], 'ru-RU': res[1] };
          })
        );
        return res$;
      },
    }),
    AppRoutingModule,
    MoreModule,
  ],
  providers: [],
  exports: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
