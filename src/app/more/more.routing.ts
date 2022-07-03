import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateToComponent } from '../components/translate-to.component';
import { TryDateComponent } from '../components/try-date.component';

const routes: Routes = [
    { path: 'translate-to', component: TranslateToComponent },
    { path: 'try-date', component: TryDateComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class MoreRoutingModule {}
