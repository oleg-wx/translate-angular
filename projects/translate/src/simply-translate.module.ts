import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DEFAULT_OPTIONS, TranslateService } from './translate/translate.service';
import { TranslatePipe, TranslateToPipe } from './translate/translate.pipe';

export function factory(init:Function){
    var ret = (service: TranslateService, http: HttpClient) => {
        return function () {
            var res = init(service, http);
            return res;
        };
    }
    return ret;
}

@NgModule({
    declarations: [TranslatePipe, TranslateToPipe],
    imports: [],
    exports: [TranslatePipe, TranslateToPipe],
    bootstrap: [],
})
export class TranslateModule {
    static forRoot(init: (service: TranslateService, http: HttpClient) => (Promise<any>), cacheDynamic:boolean = true): ModuleWithProviders<TranslateModule> {
        return {
            ngModule: TranslateModule,
            providers: [
                { provide: DEFAULT_OPTIONS, useValue: { cacheDynamic: cacheDynamic } },
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
