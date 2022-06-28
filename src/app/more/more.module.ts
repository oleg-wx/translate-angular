import { TranslateModule } from 'simply-translate-angular';
//import { TranslateModule } from 'projects/translate/src/simply-translate.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MoreComponent } from './more.component';
import { FormsModule } from '@angular/forms';
import { TitleDirective } from './title.directive';
import { RouterModule } from '@angular/router';


@NgModule({
    declarations: [MoreComponent, TitleDirective],
    imports: [TranslateModule, RouterModule, BrowserModule, FormsModule],
    exports: [MoreComponent],
    providers: [
        // {
        //     provide: APP_INITIALIZER,
        //     useFactory: (service: TranslationService) => {
        //         service.defaultLang = 'en-US';
        //         service.appendDictionary('en-US', {
        //             hello_user2: 'Hello to you {user}',
        //         });
        //         return () => Promise.resolve();
        //     },
        //     deps: [TranslationService],
        //     multi: true,
        // },
        // { provide: TranslationService, useFactory: () => new TranslationService({}), multi:false },
        // TranslationService
    ],
})
export class MoreModule {}
