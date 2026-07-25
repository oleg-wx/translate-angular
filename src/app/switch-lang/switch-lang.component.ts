import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateRootService, TranslateService } from 'src/_translate.imports';

@Component({
  selector: 'app-switch-lang',
  template: `
    <select [ngModel]="selectedLang" (ngModelChange)="onLangChange($event)">
      <option *ngFor="let lang of langs" [value]="lang">{{ lang }}</option>
    </select>

    <h3>Directive</h3>
    <div translate="hello_world"></div>
    <div translate>hello_world</div>
    <div translate>{{ 'hello_world' }}</div>

    <h3>Pipe: translate (pure)</h3>
    <div>{{ 'hello_world' | translate }}</div>

    <h3>Pipe: translate$ (impure)</h3>
    <div>{{ 'hello_world' | translate$ }}</div>

    <h3>Service: translateObservable</h3>
    <div>{{ helloWorldObservable$ | async }}</div>

    <h3>Service: translateSignal</h3>
    <div>{{ helloWorldSignal() }}</div>
  `,
})
export class SwitchLangComponent {
  langs = ['en-US', 'ru-RU'];
  selectedLang = this.root.lang;

  helloWorldObservable$: Observable<string> = this.service.translateObservable('hello_world');
  helloWorldSignal = this.service.translateSignal('hello_world');

  constructor(
    private root: TranslateRootService,
    private service: TranslateService,
  ) {}

  onLangChange(lang: string) {
    this.selectedLang = lang;
    this.root.lang = lang;
  }
}
