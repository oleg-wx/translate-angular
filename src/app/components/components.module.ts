import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitsComponent } from './visits/visits.component';
import { TranslateModule } from 'src/_translate.imports';
import { TranslateToComponent } from './translate-to.component';
import { TryDateComponent } from './try-date.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [VisitsComponent, TranslateToComponent, TryDateComponent],
  imports: [CommonModule, TranslateModule, RouterModule, FormsModule,ReactiveFormsModule],
  exports: [VisitsComponent, TranslateToComponent, TryDateComponent],
})
export class ComponentsModule {}
