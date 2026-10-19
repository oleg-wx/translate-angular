import { EnvironmentInjector, inject, runInInjectionContext } from '@angular/core';
import { forkJoin, lastValueFrom, tap } from 'rxjs';
import { DEFAULT_CONFIG, TranslateRootService } from '../translate/translate.service';
import { extendAll, firstDictionaries$ } from '../translate/translate.utils';
import { TranslateMiddlewareFn, TRANSLATE_LOADER_FNS, TRANSLATE_MIDDLEWARE_FNS, TRANSLATE_ON_READY_FNS } from './translate.features';

/**
 * Factory for the `APP_INITIALIZER` installed by `provideTranslate()`. Middleware is
 * appended first, then every loader runs in parallel, then the `onReady` hooks fire.
 * Only a loader's first result is used; one that completes empty contributes `{}`.
 */
export function translateInitializerFactory(): () => Promise<unknown> {
  const injector = inject(EnvironmentInjector);
  const service = inject(TranslateRootService);
  const config = inject(DEFAULT_CONFIG, { optional: true });
  const middlewareFns = inject(TRANSLATE_MIDDLEWARE_FNS, { optional: true }) ?? [];
  const loaderFns = inject(TRANSLATE_LOADER_FNS, { optional: true }) ?? [];
  const onReadyFns = inject(TRANSLATE_ON_READY_FNS, { optional: true }) ?? [];

  return () => {
    middlewareFns.forEach((fn) => {
      const middleware = runInInjectionContext(injector, fn) as Exclude<ReturnType<TranslateMiddlewareFn>, void> | undefined;
      middleware?.forEach((mw) => service.pipeline.addMiddleware(mw));
    });

    const opts = { lang: config?.lang, fallbackLang: config?.fallbackLang };
    const runOnReady = () => onReadyFns.forEach((fn) => runInInjectionContext(injector, fn));

    if (!loaderFns.length) {
      runOnReady();
      return Promise.resolve();
    }

    // each loader contributes its first result exactly once, so forkJoin always emits once
    const loaded$ = loaderFns.map((fn) => firstDictionaries$(runInInjectionContext(injector, () => fn(opts))));

    return lastValueFrom(
      forkJoin(loaded$).pipe(
        tap((results) => results.forEach((dictionaries) => extendAll(service, dictionaries))),
        tap(() => runOnReady()),
      ),
    );
  };
}
