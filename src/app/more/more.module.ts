import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleDirective } from './title.directive';
import { RouterModule } from '@angular/router';
import { TranslateModule } from 'src/_translate.imports';
import { ComponentsModule } from '../components/components.module';
import { MoreRoutingModule } from './more.routing';

@NgModule({
  declarations: [TitleDirective],
  imports: [
    MoreRoutingModule,
    BrowserModule,
    FormsModule,
    ComponentsModule,
    TranslateModule,
  ],
  exports: [],
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
