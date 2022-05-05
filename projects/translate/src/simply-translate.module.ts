import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { DefaultTranslateOptions, DEFAULT_OPTIONS, TranslateRootService, TranslateService } from './translate/translate.service';
import { TranslatePipe, TranslateToPipe } from './translate/translate.pipe';
import { TranslateDirective } from './translate/translate.directive';
import { lastValueFrom, Observable, tap } from 'rxjs';
import { TranslateResolve } from './translate/translate.resolver';
import { S_TRANSLATE, TranslateSettings } from './translate/translate-child-config';
import { Dictionary } from 'simply-translate';

export function factory(init?: Function) {
  var ret = (service: TranslateRootService, ...deps: any[]) => {
    return function () {
      if (init) {
        var res: Observable<Record<string, Dictionary>> = init(service, ...deps);
        res = res.pipe(
          tap((dics) => {
            Object.keys(dics).forEach((key) => {
              service.extendDictionary(key, dics[key]);
            });
          })
        );
        return lastValueFrom(res);
      }
      return Promise.resolve();
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

export interface Config extends DefaultTranslateOptions {
  init?: (service: TranslateRootService, ...any) => Observable<Record<string, Dictionary>>;
  deps?: any[];
}

export interface ChildConfig {
  extend?: (service: TranslateService, ...any) => Observable<Record<string, Dictionary>>;
  deps?: any[];
  id?: string;
}

@NgModule({
  declarations: [TranslatePipe, TranslateToPipe, TranslateDirective],
  exports: [TranslatePipe, TranslateToPipe, TranslateDirective],
})
export class TranslateModule {
  static forRoot(config?: Config): ModuleWithProviders<TranslateModule> {
    config = config ?? {
      cacheDynamic: true,
      $less: false,
      deps: [],
    };

    config.cacheDynamic = config.cacheDynamic !== undefined ? !!config.cacheDynamic : true;
    config.$less = config.$less !== undefined ? !!config.$less : false;
    config.deps = config.deps !== undefined ? [TranslateRootService, ...config?.deps] : [TranslateRootService];

    return {
      ngModule: TranslateModule,
      providers: [
        TranslateRootService,
        TranslateService,
        TranslateResolve,
        {
          provide: DEFAULT_OPTIONS,
          useValue: {
            cacheDynamic: config.cacheDynamic,
            $less: config.$less,
            onFailure: config.onFailure,
          },
        },
        {
          provide: APP_INITIALIZER,
          useFactory: factory(config.init),
          deps: config.deps,
          multi: true,
        }
      ],
    };
  }
  static forChild(config?: ChildConfig): ModuleWithProviders<TranslateModule> {
    const value: TranslateSettings = { extend: config?.extend ? config.extend : undefined, deps: config?.deps ?? [], id: config.id };
    console.log(value);
    return {
      ngModule: TranslateModule,
      providers: [
        TranslateService,
        TranslateResolve,
        {
          provide: S_TRANSLATE,
          useValue: value,
        },
      ],
    };
  }
}
