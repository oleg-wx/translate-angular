import { Component, computed, signal } from '@angular/core';
import { TranslateRootService } from 'src/_translate.imports';
import { TranslateProxyCommon } from './translate.proxy';

@Component({
  selector: 'app-try-proxy',
  template: `
    <select [ngModel]="selectedLang" (ngModelChange)="onLangChange($event)">
      <option *ngFor="let lang of langs" [value]="lang">{{ lang }}</option>
    </select>

    <h3>Just Name</h3>
    <div>{{ t9nProxy.namespace.hello_user | translate$ }}</div>

    <h3>Observable</h3>
    <div>{{ t9nProxy.namespace.hello_user.$({user:'Me'}) | async}}</div>

    <h3>Signal</h3>
    <div>{{ t9nProxy.welcome_to_app.Signal()() }}</div>
    <div>{{ t9nProxy.namespace.hello_user.Signal({ user: 'John' })() }}</div>
    <div>{{ t9nProxy.namespace.hello_user.Signal({ user: 'Jane' })() }}</div>
    <div>{{ t9nProxy.i_have_been_here_count.Signal({ count: 1, days: 2 })() }}</div>
    <div>{{ countDays() }}</div>

    <h3>Observable</h3>
    <div>{{ t9nProxy.hello_user.$({user:'Me'}) | async }}</div>

    <h3>Signal</h3>
    <div>{{ t9nProxy.hello_user.Signal({user:'Me'})()}}</div>
  `,
})
export class TryProxyComponent {
  langs = ['en-US', 'ru-RU'];
  selectedLang = this.root.lang;
  dynamicKey = 'hello_world';
  protected t9nProxy = this.translateCommon.object.proxy;
  countDaysValue = signal(0);
  countDays = this.t9nProxy.day_since_new_year.Signal(computed(() => ({ days: this.countDaysValue() })));

  constructor(
    private root: TranslateRootService,
    private translateCommon: TranslateProxyCommon,
  ) {
    setInterval(() => {
      this.countDaysValue.set(this.countDaysValue() + 1);
    }, 3000);
  }

  onLangChange(lang: string) {
    this.selectedLang = lang;
    this.root.lang = lang;
  }
}
