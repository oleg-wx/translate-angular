import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { TRANSLATE_IMPORTS, TranslateRootService, TranslateService } from 'src/_translate.imports';

@Component({
  imports: [TRANSLATE_IMPORTS, FormsModule, AsyncPipe],
  selector: 'app-switch-lang',
  template: `
    <select [ngModel]="selectedLang" (ngModelChange)="onLangChange($event)">
      @for (lang of langs; track lang) {
        <option [value]="lang">{{ lang }}</option>
      }
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
