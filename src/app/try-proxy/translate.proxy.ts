import { Injectable } from '@angular/core';
import type { CommonDictionary, MoreDictionary } from 'src/app/try-proxy/schema';
import { Dictionary } from 'simply-translate';
import { TranslateProxy, TranslateProxyLoader } from 'projects/translate/src/public_api';

@Injectable({ providedIn: 'root' })
@TranslateProxyLoader({
  id: 'common',
  dictionaries: {
    'en-US': import('src/assets/translations/proxy/en-US.json').then((module) => module.default as unknown as Dictionary),
    'ru-RU': '/assets/translations/proxy/ru-RU.json',
  },
  preloadFallbackLang: true,
  preloadLangs: ['en-US', 'ru-RU'],
})
export class TranslateProxyCommon extends TranslateProxy<CommonDictionary> {
  onLoaderError(args: { lang: string; id: string; error: any }): void {
    console.error(`Error loading translation for lang=${args.lang}, id=${args.id}`, args.error);
  }
}

@Injectable({ providedIn: 'root' })
@TranslateProxyLoader({
  id: 'more',
  extends: [TranslateProxyCommon],
  dictionaries: {
    'en-US': '/assets/translations/proxy/more/en-US.json',
    'ru-RU': '/assets/translations/proxy/more/ru-RU.json',
  },
  preloadFallbackLang: false,
})
export class TranslateProxyMore extends TranslateProxy<MoreDictionary & CommonDictionary> {
  onLoaderError(args: { lang: string; id: string; error: any }): void {
    console.error(`Error loading more translations for lang=${args.lang}, id=${args.id}`, args.error);
  }
}
