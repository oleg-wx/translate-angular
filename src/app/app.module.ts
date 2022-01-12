import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
// import { TranslateModule } from 'projects/translate/src/simply-translate.module';
// import { TranslateService} from 'projects/translate/src/translate/translate.service';
import { TranslateModule, TranslateService } from 'simply-translate-angular';
import { MoreModule } from './more/more.module';
import { AppRoutingModule } from './app.routing';
import { AppViewComponent } from './view.component';
import { forkJoin, lastValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient, HttpClientModule } from '@angular/common/http';

function getDictionary(lang: string, client: HttpClient) {
  return client.get<any>(`/assets/translations/${lang}.json`);
}

@NgModule({
  declarations: [AppComponent, AppViewComponent],
  imports: [
    HttpClientModule,
    BrowserModule,
    TranslateModule.forRoot({
      deps:[HttpClient],
      init: (service, client) => {
        let lang = 'en-US'; // window.navigator.language;
        const res$ = forkJoin([getDictionary(lang, client), getDictionary('ru-RU', client)])
          .pipe(
            map((res) => {
              service.defaultLang = lang;
              service.fallbackLang = 'ru-RU';
              service.extendDictionary(lang, res[0]);
              service.extendDictionary('ru-RU', res[1]);
            })
          );
          return res$;
      },
    }),
    AppRoutingModule,
    MoreModule,
  ],
  providers: [TranslateService],
  exports: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
