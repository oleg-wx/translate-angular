import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MoreComponent } from './more/more.component';
import { AppViewComponent } from './view.component';

const routes: Routes = [
    { path: 'view', component: AppViewComponent },
    { path: 'more', component: MoreComponent },
    { path: 'dynamic', loadChildren: ()=>import('./dynamic/dynamic.module').then((m) => m.DynamicModule) },
    // {path:'dynamic', loadChildren:'app/dynamic/dynamic.module#DynamicModule'}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
