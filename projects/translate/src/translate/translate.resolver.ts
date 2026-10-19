import { DestroyRef, ErrorHandler, Inject, inject, Injectable, Injector, Optional, runInInjectionContext } from '@angular/core';

import { Observable, of, tap, shareReplay, skip } from 'rxjs';
import { Dictionaries } from 'simply-translate';
import { TranslateChildConfig, TranslateService, TRANSLATE_CHILD } from './translate.service';
import { extendAll, firstDictionaries$ } from './translate.utils';

/** @deprecated Use `translateChildResolver` (or `withTranslateChild()`) on the route instead. */
export function translateResolve() {
  return {
    translate: TranslateResolve,
  };
}

@Injectable()
export class TranslateResolve {
  /** Per language: the load in flight, or `true` once its dictionaries are merged. */
  private readonly _extended = new Map<string, true | Observable<Dictionaries>>();
  protected readonly extend: () => Observable<Dictionaries>;

  constructor(
    protected service: TranslateService,
    injector: Injector,
    @Optional() @Inject(TRANSLATE_CHILD) settings?: TranslateChildConfig,
  ) {
    if (settings?.loadDictionaries) {
      const loadDictionaries = settings.loadDictionaries;
      this.extend = () => {
        const opts = { lang: service.lang, fallbackLang: service.fallbackLang };
        return runInInjectionContext(injector, () => firstDictionaries$(loadDictionaries(opts)));
      };

      // a language selected after the scope was first resolved needs its dictionaries too
      const errorHandler = inject(ErrorHandler);
      const sub = service.languageChange$.pipe(skip(1)).subscribe(() => {
        if (this._extended.size) {
          this.resolve()?.subscribe({ error: (error) => errorHandler.handleError(error) });
        }
      });
      inject(DestroyRef).onDestroy(() => sub.unsubscribe());
    }
  }

  public resolve(): Observable<any> | null {
    if (typeof this.extend !== 'function') {
      return null;
    }

    const lang = this.service.lang ?? '';
    const extended = this._extended.get(lang);
    if (extended === true) {
      return null;
    }
    if (extended) {
      return extended;
    }

    const load$ = this.extend().pipe(
      tap({
        next: (res) => extendAll(this.service, res),
        complete: () => this._extended.set(lang, true),
        // forget the failed attempt so the next navigation retries it
        error: () => this._extended.delete(lang),
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this._extended.set(lang, load$);
    return load$;
  }
}

/**
 * Route resolver that awaits the dictionaries declared by `provideTranslateChild()`.
 * Resolves immediately when the scope has no loader.
 *
 * ```ts
 * { path: 'orders', providers: [provideTranslateChild({ id: 'orders', loadDictionaries })], resolve: { translate: translateChildResolver } }
 * ```
 */
export const translateChildResolver = (): Observable<unknown> => inject(TranslateResolve).resolve() ?? of(null);
