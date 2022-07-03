import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicComponent } from './dynamic.component';
import { DynamicRoutingModule } from './dynamic.routing';
import { Dictionary } from 'simply-translate';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { OtherDynamicComponent } from './other-dynamic.component';
import { TranslateModule } from 'src/_translate.imports';

export function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.dynamic.json`);
}

@NgModule({
  declarations: [DynamicComponent, OtherDynamicComponent],
  imports: [
    TranslateModule.forChild({
      id: 'dynamic',
      deps: [HttpClient],
      dictionaries: {
        'en-US': {
          same_key: 'Same in the Dynamic',
        },
      },
      loadDictionaries: ({ lang, fallbackLang }, client: HttpClient) => {
        return forkJoin([getDictionary(lang, client), getDictionary('ru-RU', client)]).pipe(
          map((res) => {
            return { [lang]: res[0], 'ru-RU': res[1] };
          })
        );
      },
    }),
    CommonModule,
    DynamicRoutingModule,
  ],
  exports: [DynamicComponent],
})
export class DynamicModule {}
