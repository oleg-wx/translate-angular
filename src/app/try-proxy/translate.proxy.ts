import { Injectable } from '@angular/core';
import { TranslateProxy } from '../../../projects/translate/src/translate/translate.proxy';
import type { TestDictionary } from 'src/assets/translations/proxy/_';
import { Dictionary } from 'simply-translate';
import { TranslateLoaderSupport } from 'projects/translate/src/translate/loader/translate.loader';

@Injectable({ providedIn: 'root' })
export class TranslateProxyCommon extends TranslateProxy<TestDictionary> implements TranslateLoaderSupport {
  applyLoader() {
    return {
      id: 'common',
      dictionaries: {
        'en-US': import('src/assets/translations/proxy/en-US.json').then((module) => module.default as unknown as Dictionary),
        'ru-RU': '/assets/translations/proxy/ru-RU.json',
      },
    };
  }
  
  onLoaderError(args: { lang: string; id: string; error: any }): void {
    console.error(`Error loading translation for lang=${args.lang}, id=${args.id}`, args.error);
  }
}
