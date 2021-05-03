import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MoreComponent } from './more.component';
//import { TranslateModule } from 'projects/translate/src/simply-translate.module';
import { TranslateModule } from 'simply-translate-angular';
import { FormsModule } from '@angular/forms';


@NgModule({
    declarations: [MoreComponent],
    imports: [TranslateModule, BrowserModule, FormsModule],
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
