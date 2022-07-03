import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { combineLatest, lastValueFrom, Observable, of, tap } from 'rxjs';
import { Dictionaries, Dictionary, MiddlewareFunc, MiddlewareStatic } from 'simply-translate';
import { DefaultTranslateConfig, DEFAULT_CONFIG, ROOT_DICTIONARIES, TranslateRootService, TranslateService } from './translate/translate.service';
import { TranslatePipe, TranslateToPipe, TranslatePipeDetect } from './translate/translate.pipe';
import { TranslateDirective } from './translate/translate.directive';
import { TranslateResolve } from './translate/translate.resolver';
import { TRANSLATE_CHILD, TranslateChildConfig } from './translate/translate-child-config';

export type AddMiddlewareFunc = (...any) => Array<MiddlewareFunc | MiddlewareStatic>;
export type LoadDictionariesFunc = (opts: { lang: string; fallbackLang: string }, ...any) => Observable<Record<string, Dictionary>>;
export type InitFunc = (service: TranslateRootService, ...any) => Observable<Record<string, Dictionary>>;
export type FinalFunc = (service: TranslateRootService, ...any) => void;

export function factory(
  config: DefaultTranslateConfig,
  init?: InitFunc,
  addMiddlewareFn?: AddMiddlewareFunc,
  loadDictionariesFn?: LoadDictionariesFunc,
  finalFn?: FinalFunc
) {
  const ret = (service: TranslateRootService, ...deps: any[]) => {
    return function () {
      let customMiddleware: ReturnType<AddMiddlewareFunc> = undefined;
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
          })
        );

        if (finalFn) {
          result$ = result$.pipe(
            tap(() => {
              finalFn && finalFn(service, ...deps);
            })
          );
        }

        return lastValueFrom(result$);
      }

      const result$ = loadDics$.pipe(
        tap((dic) => {
          Object.keys(dic).forEach((key) => {
            service.extendDictionary(key, dic[key]);
          });
        })
      );

      if (finalFn) {
        return lastValueFrom(
          result$.pipe(
            tap(() => {
              finalFn && finalFn(service, ...deps);
            })
          )
        );
      }

      return lastValueFrom(result$);
    };
  };

  return ret;
}

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
  final?: FinalFunc;
  addMiddleware?: AddMiddlewareFunc;
  dictionaries?: Dictionaries;
  deps?: any[];
}

export interface ChildConfig {
  /** @deprecated */
  extend?: (service: TranslateService, ...any) => Observable<Record<string, Dictionary>>;
  loadDictionaries?: ({ lang, fallbackLang }, ...any) => Observable<Record<string, Dictionary>>;
  dictionaries?: Dictionaries;
  deps?: any[];
  id?: string;
}

@NgModule({
  declarations: [TranslatePipe, TranslateToPipe, TranslatePipeDetect, TranslateDirective],
  exports: [TranslatePipe, TranslateToPipe, TranslatePipeDetect, TranslateDirective],
})
export class TranslateModule {
  static forRoot(config?: Config): ModuleWithProviders<TranslateModule> {
    config = config ?? {
      placeholder: 'default',
      deps: [],
    };

    config.placeholder = config.placeholder !== undefined ? config.placeholder : 'default';
    config.deps = config.deps !== undefined ? [TranslateRootService, ...config?.deps] : [TranslateRootService];

    const value: DefaultTranslateConfig = {
      lang: config.lang,
      placeholder: config.placeholder,
      fallbackLang: config.fallbackLang,
    };

    return {
      ngModule: TranslateModule,
      providers: [
        TranslateRootService,
        TranslateService,
        TranslateResolve,
        {
          provide: TRANSLATE_CHILD,
          useValue: {},
        },
        {
          provide: DEFAULT_CONFIG,
          useValue: value,
        },
        { provide: ROOT_DICTIONARIES, useValue: config.dictionaries ?? {} },
        {
          provide: APP_INITIALIZER,
          useFactory: factory(config, config.init, config.addMiddleware, config.loadDictionaries, config.final),
          deps: config.deps,
          multi: true,
        },
      ],
    };
  }

  static forChild(config?: ChildConfig): ModuleWithProviders<TranslateModule> {
    const value: TranslateChildConfig = {
      loadDictionaries: config?.loadDictionaries ?? config.extend,
      dictionaries: config?.dictionaries,
      deps: config?.deps ?? [],
      id: config?.id,
    };
    return {
      ngModule: TranslateModule,
      providers: [
        TranslateService,
        TranslateResolve,
        {
          provide: TRANSLATE_CHILD,
          useValue: value,
        },
      ],
    };
  }
}
