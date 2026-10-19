import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { Dictionary, withTranslateChild } from 'simply-translate-angular';
import { DynamicComponent } from './dynamic.component';
import { OtherDynamicComponent } from './other-dynamic.component';

export function getDictionary(lang: string, client: HttpClient) {
  return client.get<Dictionary>(`/assets/translations/${lang}.dynamic.json`);
}

export const routes: Routes = [
  {
    path: '',
    // scope providers + the resolver that waits for them, for this route and its children
    ...withTranslateChild({
      id: 'dynamic',
      dictionaries: {
        'en-US': {
          same_key: 'Same in the Dynamic',
        },
      },
      loadDictionaries: ({ lang }) => {
        const client = inject(HttpClient);
        return forkJoin([getDictionary(lang!, client), getDictionary('ru-RU', client)]).pipe(
          map(([current, fallback]) => ({ [lang!]: current, 'ru-RU': fallback })),
        );
      },
    }),
    children: [
      { path: '', component: DynamicComponent },
      { path: 'other', component: OtherDynamicComponent },
    ],
  },
];
