import { Component } from '@angular/core';
@Component({
  template: `
    <div>
      Another Dynamic:
      <!-- use default language from service -->
      <h2>{{ 'hello_user_dynamic' | translate: { user: 'Basil' } }}</h2>
      <!-- use other language -->
      <h2>{{ 'hello_user_dynamic' | translateTo: 'ru-RU':{ user: 'Basil' } }}</h2>
      <h4>{{ 'hi_person' | translate: { user: 'Basil' }:'Hi to $&{user}' }}</h4>
      <h4>{{ 'hi_person' | translateTo: 'ru-RU':{ user: 'Alex' }:'Hi to \${Alex}' }}</h4>
      <small [translate]="'welcome_to_app'" to="ru-RU"></small>
      <i translate="hi_person" to="ru-RU" [values]="{ user: 'Alex' }"></i><br />
      <i translate="hi_person_no" to="ru-RU" [values]="{ user: 'Alex' }">Hi $&#123;user} from Fallback</i>
      <br />
      same: <b translate="same"></b>
      <br />
      <a [routerLink]="['other']">other</a>
    </div>
  `,
})
export class DynamicComponent {
  config: any[];
  constructor() {}
}
