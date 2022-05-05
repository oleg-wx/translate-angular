import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicComponent } from './dynamic.component';
import { AnotherDynamicRoutingModule } from './dynamic.routing';
import { Dictionary } from 'simply-translate';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { OtherDynamicComponent } from './other-dynamic.component';
import { TranslateModule, TranslateService } from 'simply-translate-angular';
//import { TranslateModule } from 'projects/translate/src/simply-translate.module';
//import { TranslateService } from 'projects/translate/src/translate/translate.service';

function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.other-dynamic.json`);
}

@NgModule({
  declarations: [DynamicComponent, OtherDynamicComponent],
  imports: [
    TranslateModule.forChild({
      id: 'another',
      deps: [HttpClient],
      extend: (service: TranslateService, client: HttpClient) => {
        return forkJoin([getDictionary(service.defaultLang, client), getDictionary(service.fallbackLang, client)]).pipe(
          map((res) => {
            return { [service.defaultLang]: res[0], 'ru-RU': res[1] };
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
