import { Inject, Injectable } from '@angular/core';
import { finalize, isObservable, Observable, tap } from 'rxjs';
import { S_TRANSLATE } from './simply-translate.module';
import { TranslateService } from './translate/translate.service';

@Injectable()
export class TranslateLoader {
  private _extended: { [key: string]: undefined | Observable<any> } = {};
  protected readonly id: string;
  protected readonly extend: () => Observable<any>;

  //abstract load(): Observable<{ [lang: string]: Dictionary }>;

  constructor(protected translateService: TranslateService, @Inject(S_TRANSLATE) translateSettings) {
    this.id = translateSettings;
  }

  public load(): Observable<any> {
    if (typeof this.extend === 'function') {
      if (!Object.prototype.hasOwnProperty.call(this._extended, this.id)) {
        if (isObservable(this._extended[this.id])) {
          return this._extended[this.id];
        }
        return (this._extended[this.id] = this.extend().pipe(
          tap((res) => {
            res;
          }),
          finalize(() => {
            this._extended[this.id] = undefined;
          })
        ));
      }
    }
    //const modulePrefixes: string[] = route.data.translationFileSuffix || [];

    return null;

    // return new Observable((observer) => {
    //   const subs = this.loadTranslateModules.loadTranslations(modulePrefixes).subscribe((res) => {
    //     observer.next();
    //     observer.complete();
    //     // if subscribe callback runs synchronously subs is not defined
    //     setTimeout(() => subs.unsubscribe());
    //   });
    // });
  }
}
