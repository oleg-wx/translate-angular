import { Component } from '@angular/core';
import { TRANSLATE_IMPORTS } from 'src/_translate.imports';
@Component({
  standalone: true,
  imports: [TRANSLATE_IMPORTS],
  selector: 'app-dynamic',
  template: `
    <h2>{{ 'hello_user_dynamic' | translateTo: 'ru-RU': { user: 'Basil' } }}</h2>
  `,
})
export class OtherDynamicComponent {
  config: any[];
  constructor() {
  }

}
