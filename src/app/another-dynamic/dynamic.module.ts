import { TranslateModule } from 'simply-translate-angular';
//import { TranslateModule } from 'projects/translate/src/simply-translate.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicComponent } from './dynamic.component';
import { AnotherDynamicRoutingModule } from './dynamic.routing';
import { Dictionary } from 'simply-translate';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { OtherDynamicComponent } from './other-dynamic.component';

function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.other-dynamic.json`);
}

@NgModule({
  declarations: [DynamicComponent, OtherDynamicComponent],
  imports: [
    TranslateModule.forChild({
      id: 'another',
      deps: [HttpClient],
      extendDictionaries: ({ lang, fallbackLang }, client: HttpClient) => {
        return forkJoin([getDictionary(lang, client), getDictionary(fallbackLang, client)]).pipe(
          map((res) => {
            return { [lang]: res[0], [fallbackLang]: res[1] };
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
