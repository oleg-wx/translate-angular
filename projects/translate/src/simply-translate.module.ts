import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { DEFAULT_OPTIONS, TranslateService } from './translate/translate.service';
import { TranslatePipe, TranslateToPipe } from './translate/translate.pipe';
import { TranslateDirective } from './translate/translate.directive';
import { lastValueFrom, Observable, tap } from 'rxjs';
import { TranslateResolve } from './translate/translate.resolver';
import { S_TRANSLATE, TranslateSettings } from './translate/translate-child-config';
import { Dictionary } from 'simply-translate';

export function factory(init?: Function) {
  var ret = (service: TranslateService, ...deps: any[]) => {
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

export interface Config {
  init?: (service: TranslateService, ...any) => Observable<Record<string, Dictionary>>;
  deps?: any[];
  cacheDynamic?: boolean;
  $less?: boolean;
}

export interface ChildConfig {
  extend?: (service: TranslateService, ...any) => Observable<Record<string, Dictionary>>;
  deps?: any[];
}

@NgModule({
  declarations: [TranslatePipe, TranslateToPipe, TranslateDirective],
  exports: [TranslatePipe, TranslateToPipe, TranslateDirective],
})
export class TranslateModule {
  static forRoot(config?: Config): ModuleWithProviders<TranslateModule> {
    return {
      ngModule: TranslateModule,
      providers: [
        TranslateService,
        TranslateResolve,
        {
          provide: DEFAULT_OPTIONS,
          useValue: {
            cacheDynamic: config?.cacheDynamic !== undefined ? !!config?.cacheDynamic : true,
            $less: config?.$less !== undefined ? !!config?.$less : false,
          },
        },
        {
          provide: APP_INITIALIZER,
          useFactory: factory(config.init),
          deps: config.deps !== undefined ? [TranslateService, ...config.deps] : [TranslateService],
          multi: true,
        },
        {
          provide: S_TRANSLATE,
          useValue: { id: 'root' },
        },
      ],
    };
  }
  static forChild(config?: ChildConfig): ModuleWithProviders<TranslateModule> {
    const value: TranslateSettings = { extend: config?.extend ? config.extend : undefined, deps: config.deps ?? [] };
    return {
      ngModule: TranslateModule,
      providers: [
        TranslateResolve,
        {
          provide: S_TRANSLATE,
          useValue: value,
        },
      ],
    };
  }
}
