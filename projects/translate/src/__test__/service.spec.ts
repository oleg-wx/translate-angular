import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { debounceTime, lastValueFrom, of, Subject } from 'rxjs';
import { DefaultTranslateConfig, TranslateRootService, TranslateService } from '../public_api';
import { TranslateModule } from '../simply-translate.module';
import { TestInjectedServiceComponent } from './core/test.component';

@Component({
  template: `<test-component #tst></test-component>`,
})
export class TestComponent {
  @ViewChild('tst', { static: true })
  testComponent!: TestInjectedServiceComponent;
}

describe('service', () => {
  const config: DefaultTranslateConfig = {
    lang: 'test',
    fallbackLang: 'fallback',
  };
  const rootDic = {
    [config.lang]: {
      hello_user: 'Hello ${user}',
      hello_user_r: 'Hello $&{user}',
      Oleg: 'mr. Oleg',
    },
  };
  const dic = {
    ['ru-RU']: {
      hello_user: 'Hello ru ${user}',
    },
    [config.fallbackLang]: {
      hello_user_fb_lang: 'Hello ${user} FB Lang',
      hello_user_fb_lang_r: 'Hello $&{user} FB Lang',
      Oleg: 'mr. Oleg (FB)',
    },
  };

  const _wait = new Subject<void>();
  _wait.next();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
      declarations: [TestInjectedServiceComponent, TestComponent],
    }).compileComponents();
  });

  let component: TestInjectedServiceComponent;
  let rootService: TranslateRootService;
  let service: TranslateService;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    TestBed.createComponent(TestComponent);
    fixture = TestBed.createComponent(TestComponent);
    await lastValueFrom(_wait.asObservable(), { defaultValue: 0 });
  });

  beforeEach(async () => {
    component = fixture.componentInstance.testComponent;
    rootService = component.root;
    service = component.service;
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();
  });

  it('should translate', () => {
    expect(service.translate('hello_user', { user: 'Oleg' })).toBe('Hello Oleg');
    expect(service.translateTo('ru-RU', 'hello_user', { user: 'Oleg' })).toBe('Hello ru Oleg');
    expect(service.translate('hello_user_r', { user: 'Oleg' })).toBe('Hello mr. Oleg');
  });

  it('should fallback', () => {
    expect(service.translate('hello_user_not_there', { user: 'Oleg' }, 'Hello user fb')).toBe('Hello user fb');
    expect(service.translate('hello_user_not_there', { user: 'Oleg' }, 'Hello ${user} fb')).toBe('Hello Oleg fb');
    expect(service.translate('hello_user_not_there', { user: 'Oleg', num: 5 }, { value: 'Hello ${user} ${num} fb', plural: { num: [['=5', 'five']] } })).toBe(
      'Hello Oleg five fb'
    );
  });

  it('should fallback to lang', () => {
    expect(service.translate('hello_user_fb_lang', { user: 'Oleg' })).toBe('Hello Oleg FB Lang');
    expect(service.translate('hello_user_fb_lang_r', { user: 'Oleg' })).toBe('Hello mr. Oleg FB Lang');
  });
});
