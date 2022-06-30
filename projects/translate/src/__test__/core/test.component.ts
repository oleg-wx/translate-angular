import { Component, Injectable, InjectionToken } from '@angular/core';
import { TranslateRootService, TranslateService } from '../../public_api';

@Component({ template: '', selector: 'test-component' })
export class TestInjectedServiceComponent {
  constructor(public service: TranslateService, public root: TranslateRootService) {
  }
}

export interface InjectedValue {
  value: number;
}

@Injectable({
  providedIn: 'root',
})
export class InjectedTestClass implements InjectedValue {
  value = 0;
}

export const INJECTED_TOKEN = new InjectionToken<InjectedValue>('INJECTED_TOKEN');
