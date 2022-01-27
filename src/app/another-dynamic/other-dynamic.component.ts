import { Component } from '@angular/core';
@Component({
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
