import { Injectable } from '@angular/core';
import type { TestDictionary } from 'src/app/try-proxy/schema';
import { Dictionary } from 'simply-translate';
import { TranslateLoaderSupport, TranslateProxy } from 'projects/translate/src/public_api';

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
