import { Component } from '@angular/core';
import { TranslateRootService } from 'src/_translate.imports';
import { TranslateProxyCommon } from '../translate.common';

@Component({
  selector: 'app-try-proxy',
  template: `
    <select [ngModel]="selectedLang" (ngModelChange)="onLangChange($event)">
      <option *ngFor="let lang of langs" [value]="lang">{{ lang }}</option>
    </select>

    <h3>Just Name</h3>
    <div>{{ t9nCommon.namespace.user | translate}}</div>

    <h3>Observable</h3>
    <div>{{ t9nCommon.namespace.hello_user.$() | async}}</div>

    <h3>Key inferred from static DOM content</h3>
    <div translate>hello_world</div>

    <h3>Key and value from attributes</h3>
    <div translate="hello_user" [values]="{ user: 'Oleg' }"></div>

    <h3>Key from DOM and value from attribute</h3>
    <div translate [values]="{ user: 'Oleg' }">hello_user</div>

    <h3>Explicit target language via [to]</h3>
    <div translate="hello_user" to="ru-RU" [values]="{ user: 'Oleg' }"></div>

    <h3>Fallback: static DOM content (key not found)</h3>
    <div translate="does_not_exist">Fallback from content</div>

    <h3>Fallback: explicit attribute (key not found)</h3>
    <div translate="does_not_exist" fallback="Fallback via attribute"></div>

    <h3>Fallback: bound object with plural (key not found)</h3>
    <div translate="does_not_exist" [values]="{ count: 3 }" [fallback]="{ value: 'Count: \${count}', plural: { count: [['=3', 'three']] } }"></div>

    <h3>No key, no fallback, no content</h3>
    <div translate></div>

    ---
    <h2>Dynamic content</h2>
    <h3>Dynamic key</h3>
    <div [translate]="dynamicKey"></div>
    <h3>Dynamic DOM</h3>
    <div translate>{{ dynamicKey }}</div>
    <button (click)="dynamicKey = 'hello_world'">Set key to hello_world</button>
    <button (click)="dynamicKey = 'hello_user'">Set key to hello_user</button>
  `,
})
export class TryProxyComponent {
  langs = ['en-US', 'ru-RU'];
  selectedLang = this.root.lang;
  dynamicKey = 'hello_world';
  protected t9nCommon = this.translateCommon.object;

  constructor(
    private root: TranslateRootService,
    private translateCommon: TranslateProxyCommon,
  ) {}

  onLangChange(lang: string) {
    this.selectedLang = lang;
    this.root.lang = lang;
  }
}
