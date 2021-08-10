import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DEFAULT_OPTIONS, TranslateService } from './translate/translate.service';
import { TranslatePipe, TranslateToPipe } from './translate/translate.pipe';
import { TranslateDirective } from './translate/translate.directive';

export function factory(init?: Function) {
  var ret = (service: TranslateService, http: HttpClient) => {
    return function () {
      if (init) {
        var res = init(service, http);
        return res;
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
  init?: (...any) => Promise<any>;
  deps?: any[];
  cacheDynamic?: boolean;
  $less?: boolean;
}

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
}
