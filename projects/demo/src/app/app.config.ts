import { HttpClient, provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { Dictionary, provideTranslate, withLoader, withMiddleware } from 'src/_translate.imports';
import { routes } from './app.routes';
import { TranslateProxyMore, TranslateProxyOneMore } from './try-proxy/translate.proxy';

function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.json`);
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular 21 bootstraps zoneless by default; the demo still relies on zone.js
    provideZoneChangeDetection(),
    provideHttpClient(),
    provideRouter(routes),

    provideTranslate(
      {
        lang: 'en-US',
        fallbackLang: 'en-US',
      },

      withMiddleware(() => [
        ({ params, result }) => {
          if (result.fallingBack) {
            console.warn('falling back:', `${params.key.toString()}, [${params.lang}]`);
          }
        },
      ]),

      // dependencies come from inject(), there is no deps array any more
      withLoader(({ lang }) => {
        const client = inject(HttpClient);
        return forkJoin([getDictionary(lang!, client), getDictionary('ru-RU', client)]).pipe(
          map(([current, fallback]) => ({ [lang!]: current, 'ru-RU': fallback })),
        );
      }),
    ),

    TranslateProxyMore,
    TranslateProxyOneMore,
  ],
};
