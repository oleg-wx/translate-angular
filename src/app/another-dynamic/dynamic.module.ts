import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicComponent } from './dynamic.component';
import { AnotherDynamicRoutingModule } from './dynamic.routing';
import { Dictionary } from 'simply-translate';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { OtherDynamicComponent } from './other-dynamic.component';
import { TranslateModule } from 'src/_translate.imports';

function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.other-dynamic.json`);
}

@NgModule({
  declarations: [DynamicComponent, OtherDynamicComponent],
  imports: [
    TranslateModule.forChild({
      id: 'another_dynamic',
      deps: [HttpClient],
      loadDictionaries: ({ lang }, client: HttpClient) => {
        return forkJoin([getDictionary(lang, client), getDictionary('ru-RU', client)]).pipe(
          map((res) => {
            return { [lang]: { ...res[0], same_key: 'Same in another Dynamic' }, ['ru-RU']: res[1] };
          })
        );
      },
    }),
    CommonModule,
    AnotherDynamicRoutingModule,
  ],
  exports: [DynamicComponent],
})
export class AnotherDynamicModule {}
