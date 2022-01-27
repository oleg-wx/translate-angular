import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Dictionary } from 'simply-translate';
import { TranslateService } from './translate.service';

export interface TranslateSettings {
  extend: (service: TranslateService, ...deps: any[]) => Observable<{ [lang: string]: Dictionary }>;
  deps:any[],
}
export const S_TRANSLATE = new InjectionToken<TranslateSettings>('S_TRANSLATE');
