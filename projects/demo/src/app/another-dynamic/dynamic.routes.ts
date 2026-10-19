import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { Dictionary, withTranslateChild } from 'src/_translate.imports';
import { DynamicComponent } from './dynamic.component';
import { OtherDynamicComponent } from './other-dynamic.component';

function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.other-dynamic.json`);
}

export const routes: Routes = [
  {
    path: '',
    ...withTranslateChild({
      id: 'another_dynamic',
      loadDictionaries: ({ lang }) => {
        const client = inject(HttpClient);
        return forkJoin([getDictionary(lang!, client), getDictionary('ru-RU', client)]).pipe(
          map(([current, fallback]) => ({ [lang!]: { ...current, same_key: 'Same in another Dynamic' }, 'ru-RU': fallback })),
        );
      },
    }),
    children: [
      { path: '', component: DynamicComponent },
      { path: 'other', component: OtherDynamicComponent },
    ],
  },
];
