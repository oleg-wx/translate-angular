import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppTranslateComponent } from './translate.component';

const routes: Routes = [
    { path: 'translate', component: AppTranslateComponent },
    { path: 'translate', component: AppTranslateComponent },
    { path: 'dynamic', loadChildren: ()=>import('./dynamic/dynamic.module').then((m) => m.DynamicModule) },
    { path: 'another-dynamic', loadChildren: ()=>import('./another-dynamic/dynamic.module').then((m) => m.AnotherDynamicModule) },
    // {path:'dynamic', loadChildren:'app/dynamic/dynamic.module#DynamicModule'}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
