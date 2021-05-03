import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicComponent } from './dynamic.component';
import { DynamicRoutingModule } from './dynamic.routing';
//import { TranslateModule } from 'projects/translate/src/simply-translate.module';
import { TranslateModule } from 'simply-translate-angular';

@NgModule({
    declarations: [DynamicComponent],
    imports: [TranslateModule, CommonModule,DynamicRoutingModule],
    exports: [DynamicComponent],
})
export class DynamicModule {}
