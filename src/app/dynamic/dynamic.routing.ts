import { TranslateResolve } from 'simply-translate-angular';
//import { TranslateResolve } from 'projects/translate/src/translate/translate.resolver';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DynamicComponent } from './dynamic.component';
import { OtherDynamicComponent } from './other-dynamic.component';

const routes: Routes = [
  { path: '', component: DynamicComponent, resolve: { resolve: TranslateResolve } },
  { path: 'other', component: OtherDynamicComponent, resolve: { resolve: TranslateResolve } },
  // {path:'dynamic', loadChildren:'app/dynamic/dynamic.module#DynamicModule'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DynamicRoutingModule {}
