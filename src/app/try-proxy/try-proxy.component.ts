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
    <div>{{ t9nCommon.namespace.hello_user | translate$ }}</div>

    <h3>Observable</h3>
    <div>{{ t9nCommon.namespace.hello_user.$() | async}}</div>

    <h3>Signal</h3>
    <div>{{ t9nCommon.namespace.hello_user.Signal()()}}</div>

    <h3>Observable</h3>
    <div>{{ t9nCommon.hello_user.$() | async }}</div>

    <h3>Signal</h3>
    <div>{{ t9nCommon.hello_user.Signal()()}}</div>
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
