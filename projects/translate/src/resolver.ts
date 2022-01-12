import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { isObservable, Observable, of, tap, finalize } from 'rxjs';
import { Dictionary } from 'simply-translate';
import { S_TRANSLATE } from './simply-translate.module';
import { TranslateService } from './translate/translate.service';

@Injectable({
  providedIn: 'root',
})
export class LoadTranslateModules {
  loadedModules: { [key: string]: Observable<any> } = {};
  lang$: Observable<string>;

  constructor(private translateService: TranslateService, private http: HttpClient) {
    // if (this.appConfig.ENABLE_TRANSLATIONS) {
    //     this.lang$ = authService.user.info$.pipe(
    //         switchMap((userInfo) => this.userClient.get(userInfo.userId, 1)),
    //         map((user) => user.language.langCulture || 'en-US'),
    //         shareReplay(1)
    //     );
    // } else {
    //     this.lang$ = of('en-US').pipe(shareReplay(1));
    // }
  }
  /**
   *
   * @param modules modules to load
   * @param lang default language
   * @param soeLang temporary for testing soeTranslations
   * @param fallbackLang fallback language to load dictionaries
   * @returns
   */
  loadTranslations(modules: string[]): void {
    // return this.lang$.pipe(
    //     switchMap((userLang) => {
    //         const lang = (this.soeTranslateService.defaultLang = userLang); //'en-Dev');
    //         const fallbackLang = (this.soeTranslateService.fallbackLang = 'en-US');
    //         let baseHref = (this.router as any).location._baseHref;
    //         let origin = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}${
    //             baseHref ? baseHref : ''
    //         }`;
    //         const prefix = `${origin}/assets/i18n`;
    //         const modulesToLoad: [string, string?, string?][] = modules.reduce((res, module) => {
    //             res.push([lang, module, 'lazy']);
    //             if (fallbackLang && fallbackLang !== lang) res.push([fallbackLang, module, 'lazy']);
    //             return res;
    //         }, []);
    //         if (fallbackLang && fallbackLang !== lang) modulesToLoad.push([fallbackLang]);
    //         modulesToLoad.push([lang]);
    //         const requests: Array<Observable<TranslationDictionary>> = modulesToLoad.map((module) => {
    //             const uniqueName = module.filter((o) => o).join('-');
    //             const [langIn, moduleIn] = module;
    //             if (this.loadedModules[uniqueName]) return this.loadedModules[uniqueName];
    //             return (this.loadedModules[uniqueName] = this.http.get<TranslationDictionary>(`${prefix}/${langIn}/${uniqueName}.json`).pipe(
    //                 catchError((e) => of(undefined)),
    //                 map((res) => {
    //                     if (res) {
    //                         console.log('Translations resolved:', langIn, moduleIn);
    //                         this.soeTranslateService.extendDictionary(langIn, res);
    //                         if (!this.translateService.hasTranslations(moduleIn || 'common') && langIn !== lang) {
    //                             this.translateService.loadTranslations(res, moduleIn || 'common');
    //                         }
    //                     }
    //                     return res;
    //                 }),
    //                 shareReplay(1)
    //             ));
    //         });
    //         return forkJoin(requests).pipe(
    //             tap(() => {
    //                 console.log('TRANSLATIONS RESOLVED');
    //             }),
    //             catchError(() => of(undefined))
    //         );
    //     })
    //);
  }
}

@Injectable({ providedIn: 'root' })
export class TranslateResolve implements Resolve<any> {
  private _extended: { [key: string]: undefined | Observable<any> } = {};
  protected readonly id: string;
  protected readonly extend: () => Observable<any>;

  //abstract load(): Observable<{ [lang: string]: Dictionary }>;

  constructor(protected translateService: LoadTranslateModules, @Inject(S_TRANSLATE) translateSettings) {
    this.id = translateSettings;
  }

  public resolve(): Observable<any> {
    if (typeof this.extend === 'function') {
      if (!Object.prototype.hasOwnProperty.call(this._extended, this.id)) {
        if(isObservable(this._extended[this.id])){
          return this._extended[this.id]
        }
        return (this._extended[this.id] = this.extend().pipe(tap((res) => {
          res
        }),finalize(()=>{
          this._extended[this.id] = undefined;
        })));
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

// export abstract class TranslateResolve extends TranslateResolveBase {
// load(){

// }
// }
