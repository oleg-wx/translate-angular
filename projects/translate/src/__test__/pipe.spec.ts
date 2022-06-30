import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { debounceTime, lastValueFrom, of, Subject } from 'rxjs';
import { TranslateDirective } from 'simply-translate-angular';
import { DefaultTranslateConfig, DEFAULT_CONFIG, ROOT_DICTIONARIES, TranslateRootService, TranslateService } from '../public_api';
import { TranslateModule } from '../simply-translate.module';
import { TestInjectedServiceComponent } from './core/test.component';

@Component({
  template: `
    <div id="d1">{{ 'hello_user' | translate: { user: 'Oleg' } }}</div>
    <div id="d2">{{ 'hello_user' | translateTo: 'ru-RU': { user: 'Oleg' } }}</div>
    <div id="d3">{{ 'hello_user_not_there' | translate: { user: 'Oleg' } :'Hello user fb' }}</div>
    <div id="d4">{{ 'hello_user_not_there' | translate: { user: 'Oleg' } :'Hello \${user} fb' }}</div>
  `,
})
export class TestDirectiveComponent {}

describe('pipe', () => {
  const config: DefaultTranslateConfig = {
    lang: 'test',
  };
  const rootDic = {
    [config.lang]: {
      hello_user: 'Hello ${user}',
    },
  };
  const dic = {
    ['ru-RU']: {
      hello_user: 'Hello ru ${user}',
    },
  };

  const _wait = new Subject<void>();
  _wait.next();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [TestDirectiveComponent],
      imports: [
        TranslateModule.forRoot({
          ...config,
          dictionaries: rootDic,
          loadDictionaries: () => of(dic).pipe(debounceTime(10)),
          final: () => {
            _wait.next();
            _wait.complete();
          },
        }),
      ],
    });
  });

  let component: TestDirectiveComponent;
  let fixture: ComponentFixture<TestDirectiveComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TestDirectiveComponent);

    await lastValueFrom(_wait.asObservable(), { defaultValue: 0 });

    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();

    element = fixture.elementRef.nativeElement;
    // rootService = component.root;
    // service = component.service;
  });

  it('should work', () => {
    expect(element.querySelector<HTMLElement>('#d1').innerText.trim()).toBe('Hello Oleg');
    expect(element.querySelector<HTMLElement>('#d2').innerText.trim()).toBe('Hello ru Oleg');
    expect(element.querySelector<HTMLElement>('#d3').innerText.trim()).toBe('Hello user fb');
    expect(element.querySelector<HTMLElement>('#d4').innerText.trim()).toBe('Hello Oleg fb');
  });
});
