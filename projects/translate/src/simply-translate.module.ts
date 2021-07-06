import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DEFAULT_OPTIONS, TranslateService } from './translate/translate.service';
import { TranslatePipe, TranslateToPipe } from './translate/translate.pipe';
import { TranslateDirective } from './translate/translate.directive';

export function factory(init: Function) {
    var ret = (service: TranslateService, http: HttpClient) => {
        return function () {
            var res = init(service, http);
            return res;
        };
    };
    return ret;
}

@NgModule({
    declarations: [TranslatePipe, TranslateToPipe, TranslateDirective],
    imports: [],
    exports: [TranslatePipe, TranslateToPipe, TranslateDirective],
    bootstrap: [],
})
export class TranslateModule {
    static forRoot(
        init: (service: TranslateService, http: HttpClient) => Promise<any>,
        cacheDynamic = true,
        $less = false
    ): ModuleWithProviders<TranslateModule> {
        return {
            ngModule: TranslateModule,
            providers: [
                { provide: DEFAULT_OPTIONS, useValue: { cacheDynamic: cacheDynamic, $less: $less } },
                {
                    provide: APP_INITIALIZER,
                    useFactory: factory(init),
                    deps: [TranslateService, HttpClient],
                    multi: true,
                },
            ],
        };
    }
}
