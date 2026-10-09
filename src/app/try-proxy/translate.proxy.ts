import { Injectable } from '@angular/core';
import { Dictionary } from 'simply-translate';
import { TranslateProxy, TranslateProxyLoader } from 'simply-translate-angular-proxy';
import type { CommonDictionary, MoreDictionary, OneMoreDictionary } from 'src/app/try-proxy/schema';

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

@Injectable()
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

@Injectable()
@TranslateProxyLoader({
  id: 'one-more',
  extends: [TranslateProxyCommon],
  dictionaries: {
    'en-US': '/assets/translations/proxy/one-more/en-US.json',
    'ru-RU': '/assets/translations/proxy/one-more/ru-RU.json',
  },
  preloadFallbackLang: false,
})
export class TranslateProxyOneMore extends TranslateProxy<OneMoreDictionary & CommonDictionary> {
  onLoaderError(args: { lang: string; id: string; error: any }): void {
    console.error(`Error loading one more translations for lang=${args.lang}, id=${args.id}`, args.error);
  }
}
