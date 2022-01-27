import { Inject, Injectable, Injector, ProviderToken } from '@angular/core';
import { Resolve } from '@angular/router';
import { isObservable, Observable, of, tap, finalize } from 'rxjs';
import { Dictionary } from 'simply-translate';
import { S_TRANSLATE, TranslateSettings } from './translate-child-config';
import { TranslateService } from './translate.service';

@Injectable()
export class TranslateResolve implements Resolve<any> {
  private _extended?: true | Observable<any>;
  protected readonly extend: () => Observable<any>;

  constructor(protected service: TranslateService, injector: Injector, @Inject(S_TRANSLATE) settings: TranslateSettings) {
    this.extend = () => {
      const deps = settings.deps.map((d: ProviderToken<any>) => injector.get(d));
      return settings.extend(service, ...deps);
    };
  }

  public resolve(): Observable<any> | null {
    debugger
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
