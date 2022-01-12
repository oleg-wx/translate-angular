import { v4 as uuidv4 } from 'uuid';
import { APP_INITIALIZER, InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DEFAULT_OPTIONS, TranslateService } from './translate/translate.service';
import { TranslatePipe, TranslateToPipe } from './translate/translate.pipe';
import { TranslateDirective } from './translate/translate.directive';
import { isObservable, lastValueFrom, Observable, tap } from 'rxjs';
import { Dictionary } from 'simply-translate';

export function factory(init?: Function) {
  var ret = (service: TranslateService) => {
    return function () {
      if (init) {
        var res: Observable<{ [key: string]: Dictionary }> = init(service);
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
  init?: (service: TranslateService, ...any) => Observable<Dictionary>;
  deps?: any[];
  cacheDynamic?: boolean;
  $less?: boolean;
}

export interface ChildConfig {
  extend?: (service: TranslateService, ...any) => Observable<Dictionary>;
  deps?: any[];
  id?: string;
}

export const S_TRANSLATE = new InjectionToken<{ id: string; extend: Observable<{ [lang: string]: Dictionary }> }>('S_TRANSLATE');

@NgModule({
  declarations: [TranslatePipe, TranslateToPipe, TranslateDirective],
  imports: [],
  exports: [TranslatePipe, TranslateToPipe, TranslateDirective],
  bootstrap: [],
})
export class TranslateModule {
  static forRoot(config?: Config): ModuleWithProviders<TranslateModule> {
    return {
      ngModule: TranslateModule,
      providers: [
        TranslateService,
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
      ],
    };
  }
  static forChild(config?: ChildConfig): ModuleWithProviders<TranslateModule> {
    return {
      ngModule: TranslateModule,
      providers: [
        TranslateService,
        {
          provide: S_TRANSLATE,
          useValue: { id: config?.id?.trim() || uuidv4(), init:config?.extend ? config.extend: undefined },
        },
      ],
    };
  }
}
