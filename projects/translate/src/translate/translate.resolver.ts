import { Inject, Injectable, Injector, Optional, ProviderToken } from '@angular/core';
import { Resolve } from '@angular/router';
import { isObservable, Observable, of, tap, finalize } from 'rxjs';
import { Dictionary } from 'simply-translate';
import { TranslateChildConfig, TranslateService, TRANSLATE_CHILD } from './translate.service';

export function translateResolve() {
  return {
    translate: TranslateResolve,
  };
}

@Injectable()
export class TranslateResolve implements Resolve<any> {
  private _extended?: true | Observable<any>;
  protected readonly extend: () => Observable<any>;

  constructor(protected service: TranslateService, injector: Injector, @Optional() @Inject(TRANSLATE_CHILD) settings?: TranslateChildConfig) {
    if (settings?.loadDictionaries) {
      const deps_ = settings.deps ?? [];
      const loadDictionaries = settings.loadDictionaries;
      this.extend = () => {
        const deps = deps_.map((d: ProviderToken<any>) => injector.get(d));
        return loadDictionaries({ lang: service.lang, fallbackLang: service.fallbackLang }, ...deps);
      };
    }
  }

  public resolve(): Observable<any> | null {
    if (typeof this.extend === 'function') {
      if (this._extended !== true) {
        if (isObservable(this._extended)) {
          return this._extended;
        }
        return (this._extended = this.extend().pipe(
          tap((res: { [lang: string]: Dictionary }) => {
            for (let lang in res) {
              this.service.extendDictionary(lang, res[lang]);
            }
          }),
          finalize(() => {
            this._extended = true;
          })
        ));
      }
    }
    return null;
  }
}
