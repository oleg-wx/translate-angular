import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Dictionaries } from 'simply-translate';

export interface TranslateChildConfig {
  id?: string;
  dictionaries?: Dictionaries;
  loadDictionaries?: (opts: { lang: string; fallbackLang: string }, ...deps: any[]) => Observable<Dictionaries>;
  deps?: any[];
}
export const TRANSLATE_CHILD = new InjectionToken<TranslateChildConfig>('TranslateService TRANSLATE_CHILD');
