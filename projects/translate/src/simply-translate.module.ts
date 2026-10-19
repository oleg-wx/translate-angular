import { inject, ModuleWithProviders, NgModule, ProviderToken } from '@angular/core';
import { combineLatest, lastValueFrom, Observable, of, tap } from 'rxjs';
import { Dictionaries, Dictionary, MiddlewareFunc, MiddlewareStatic } from 'simply-translate';
import { DefaultTranslateConfig, TranslateRootService, TranslateService, TranslateServiceBase } from './translate/translate.service';
import {
  TranslateFeature,
  TranslateLoaderFn,
  withConfig,
  withDictionaries,
  withLoader,
  withMiddleware,
  withOnReady,
} from './providers/translate.features';
import { provideTranslateChild, TRANSLATE_IMPORTS, ɵtranslateRootProviders } from './providers/translate.providers';

export type AddMiddlewareFunc = (...any: any[]) => Array<MiddlewareFunc | MiddlewareStatic>;
export type LoadDictionariesFunc = (
  opts: { lang: string | undefined; fallbackLang: string | undefined },
  ...any: any[]
) => Observable<Record<string, Dictionary>>;
export type InitFunc = (service: TranslateRootService, ...any: any[]) => Observable<Record<string, Dictionary>>;
export type FinalFunc<TService extends TranslateServiceBase> = (service: TService, ...any: any[]) => void;

/**
 * @deprecated Kept for `TranslateModule.forRoot()`. `provideTranslate()` installs its own
 * `APP_INITIALIZER`; see `translateInitializerFactory`.
 */
export function factory(
  config: DefaultTranslateConfig,
  init?: InitFunc,
  addMiddlewareFn?: AddMiddlewareFunc,
  loadDictionariesFn?: LoadDictionariesFunc,
  finalFn?: FinalFunc<TranslateRootService>,
) {
  const ret = (service: TranslateRootService, ...deps: any[]) => {
    return function () {
      let customMiddleware: ReturnType<AddMiddlewareFunc> | undefined = undefined;
      if (addMiddlewareFn) {
        customMiddleware = addMiddlewareFn(...deps);
        // add some middlewares
        customMiddleware?.forEach((mw) => service.pipeline.addMiddleware(mw));
      }

      let loadDics$: ReturnType<LoadDictionariesFunc>;
      if (loadDictionariesFn) {
        loadDics$ = loadDictionariesFn({ lang: config.lang, fallbackLang: config.fallbackLang }, ...deps);
      } else {
        loadDics$ = of({});
      }

      if (init) {
        const init$: ReturnType<InitFunc> = init(service, ...deps);
        let result$ = combineLatest([loadDics$, init$]).pipe(
          tap(([dic1, dic2]) => {
            [dic1, dic2].forEach((dic) => {
              Object.keys(dic).forEach((key) => {
                service.extendDictionary(key, dic[key]);
              });
            });
          }),
        );

        if (finalFn) {
          result$ = result$.pipe(
            tap(() => {
              finalFn && finalFn(service, ...deps);
            }),
          );
        }

        return lastValueFrom(result$);
      }

      const result$ = loadDics$.pipe(
        tap((dic) => {
          Object.keys(dic).forEach((key) => {
            service.extendDictionary(key, dic[key]);
          });
        }),
      );

      if (finalFn) {
        return lastValueFrom(
          result$.pipe(
            tap(() => {
              finalFn && finalFn(service, ...deps);
            }),
          ),
        );
      }

      return lastValueFrom(result$);
    };
  };

  return ret;
}

/** @deprecated `provideTranslate()` guards itself; see the error it throws when used twice. */
export function forRootGuard(service: TranslateService): any {
  if (service) {
    throw new Error(`TranslateModule.forRoot() called twice. Lazy loaded modules should use TranslateModule.forChild() instead.`);
  }
  return 'guarded';
}

export interface Config extends DefaultTranslateConfig {
  /** @deprecated */
  init?: InitFunc;
  loadDictionaries?: LoadDictionariesFunc;
  final?: FinalFunc<TranslateRootService>;
  addMiddleware?: AddMiddlewareFunc;
  dictionaries?: Dictionaries;
  /** @deprecated Take dependencies with `inject()` inside the callbacks instead. */
  deps?: any[];
}

export interface ChildConfig {
  /** @deprecated */
  extend?: (service: TranslateService, ...any) => Observable<Record<string, Dictionary>>;
  loadDictionaries?: ({ lang, fallbackLang }, ...any) => Observable<Record<string, Dictionary>>;
  dictionaries?: Dictionaries;
  /** @deprecated Take dependencies with `inject()` inside `loadDictionaries` instead. */
  deps?: any[];
  id?: string;
}

/** Resolves a legacy `deps: [...]` array from the current injection context. */
function resolveDeps(deps: any[] | undefined): any[] {
  return (deps ?? []).map((token: ProviderToken<any>) => inject(token));
}

/** Translates a legacy `forRoot()` config into the feature set `provideTranslate()` understands. */
export function configToFeatures(config: Config = {}): TranslateFeature[] {
  const features: TranslateFeature[] = [
    withConfig({ lang: config.lang, fallbackLang: config.fallbackLang, placeholder: config.placeholder }),
    withDictionaries(config.dictionaries ?? {}),
  ];

  const { addMiddleware, loadDictionaries, init, final, deps } = config;

  if (addMiddleware) {
    features.push(withMiddleware(() => addMiddleware(...resolveDeps(deps))));
  }
  if (loadDictionaries) {
    features.push(withLoader((opts) => loadDictionaries(opts, ...resolveDeps(deps))));
  }
  if (init) {
    features.push(withLoader(() => init(inject(TranslateRootService), ...resolveDeps(deps))));
  }
  if (final) {
    features.push(withOnReady(() => final(inject(TranslateRootService), ...resolveDeps(deps))));
  }

  return features;
}

@NgModule({
  imports: [...TRANSLATE_IMPORTS],
  exports: [...TRANSLATE_IMPORTS],
})
export class TranslateModule {
  /** @deprecated Use `provideTranslate()` in the application providers instead. */
  static forRoot(config?: Config): ModuleWithProviders<TranslateModule> {
    return {
      ngModule: TranslateModule,
      // unguarded: NgModule apps may also import forRoot() in a lazily loaded module
      providers: [ɵtranslateRootProviders(configToFeatures(config), { guard: false })],
    };
  }

  /** @deprecated Use `provideTranslateChild()` in `Route.providers` instead. */
  static forChild(config: ChildConfig = {}): ModuleWithProviders<TranslateModule> {
    const { loadDictionaries, extend, deps } = config;

    let load: TranslateLoaderFn | undefined;
    if (loadDictionaries) {
      load = (opts) => loadDictionaries(opts, ...resolveDeps(deps));
    } else if (extend) {
      load = () => extend(inject(TranslateService), ...resolveDeps(deps));
    }

    return {
      ngModule: TranslateModule,
      providers: [provideTranslateChild({ id: config.id, dictionaries: config.dictionaries, loadDictionaries: load })],
    };
  }
}
