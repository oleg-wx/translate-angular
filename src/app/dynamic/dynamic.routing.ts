import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DynamicComponent } from './dynamic.component';

const routes: Routes = [
    { path: '', component: DynamicComponent },
    // {path:'dynamic', loadChildren:'app/dynamic/dynamic.module#DynamicModule'}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DynamicRoutingModule {}
