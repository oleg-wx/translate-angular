import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { debounceTime, lastValueFrom, of, Subject } from 'rxjs';
import { DefaultTranslateConfig, TranslateRootService, TranslateService } from '../public_api';
import { TranslateModule } from '../simply-translate.module';

// Mock component helper to inject the services
@Component({
  selector: 'test-component',
  template: `<div>Test Framework Elements</div>`
})
class TestInjectedServiceComponent {
  constructor(public root: TranslateRootService, public service: TranslateService) {}
}

@Component({
  template: `<test-component #tst></test-component>`,
})
export class TestComponent {
  @ViewChild('tst', { static: true })
  testComponent!: TestInjectedServiceComponent;
}

describe('Translate Service Integration', () => {
  const config = {
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

  let component: TestInjectedServiceComponent;
  let rootService: TranslateRootService;
  let service: TranslateService;
  let fixture: ComponentFixture<TestComponent>;
  let _wait: Subject<void>;

  beforeEach(async () => {
    // Recreate the lifecycle subject uniquely before every single test run
    _wait = new Subject<void>();

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

  beforeEach(fakeAsync(() => {
    // 1. Create a single master test fixture environment
    fixture = TestBed.createComponent(TestComponent);
    
    // 2. Perform initial change detection to start the module dictionaries download loop
    fixture.detectChanges();

    // 3. Fast-forward virtual time past the 10ms dictionary debounce delay
    tick(15); 

    // 4. Safely pull instances out after the asynchronous microtasks complete
    component = fixture.componentInstance.testComponent;
    rootService = component.root;
    service = component.service;
  }));

  it('should translate correctly using root configurations', () => {
    expect(service.translate('hello_user', { user: 'Oleg' })).toBe('Hello Oleg');
    expect(service.translateTo('ru-RU', 'hello_user', { user: 'Oleg' })).toBe('Hello ru Oleg');
    expect(service.translate('hello_user_r', { user: 'Oleg' })).toBe('Hello mr. Oleg');
  });

  it('should fall back gracefully when string templates or objects match structural overrides', () => {
    expect(service.translate('hello_user_not_there', { user: 'Oleg' }, 'Hello user fb')).toBe('Hello user fb');
    expect(service.translate('hello_user_not_there', { user: 'Oleg' }, 'Hello ${user} fb')).toBe('Hello Oleg fb');
    expect(service.translate('hello_user_not_there', { user: 'Oleg', num: 5 }, { 
      value: 'Hello ${user} ${num} fb', 
      plural: { num: [['=5', 'five']] } 
    })).toBe('Hello Oleg five fb');
  });

  it('should cascade lookups to the designated fallback fallbackLang configuration', () => {
    expect(service.translate('hello_user_fb_lang', { user: 'Oleg' })).toBe('Hello Oleg FB Lang');
    expect(service.translate('hello_user_fb_lang_r', { user: 'Oleg' })).toBe('Hello mr. Oleg FB Lang');
  });

  it('reacts to language changes across translate, signal, and observable APIs', () => {
    const values = { user: 'Oleg' };
    expect(service.translate('hello_user', values)).toBe('Hello Oleg');

    const signalResult = service.translateSignal('hello_user', values);
    expect(signalResult()).toBe('Hello Oleg');

    const observableValues: string[] = [];
    const obsSub = service.translateObservable('hello_user', values).subscribe((v) => observableValues.push(v));

    let langChange: { lang: string; oldLang?: string } | undefined;
    const langSub = rootService.languageChange$.subscribe((change) => (langChange = change));

    const initialVersion = service.stateVersion();

    rootService.lang = 'ru-RU';

    expect(langChange).toEqual(jasmine.objectContaining({ lang: 'ru-RU', oldLang: 'test' }));
    expect(service.stateVersion()).toBeGreaterThan(initialVersion);
    expect(service.translate('hello_user', values)).toBe('Hello ru Oleg');
    expect(signalResult()).toBe('Hello ru Oleg');
    expect(observableValues).toEqual(['Hello Oleg', 'Hello ru Oleg']);

    obsSub.unsubscribe();
    langSub.unsubscribe();
  });

  it('reacts to dictionary changes across translate, signal, and observable APIs', () => {
    expect(rootService.hasTranslation('new_key')).toBeFalse();

    const signalResult = service.translateSignal('new_key');
    expect(signalResult()).toBe('new_key');

    const observableValues: string[] = [];
    const obsSub = service.translateObservable('new_key').subscribe((v) => observableValues.push(v));

    let dictionaryChanged = false;
    const dicSub = rootService.dictionaryChange$.subscribe(() => (dictionaryChanged = true));

    const initialVersion = service.stateVersion();

    service.extendDictionary(service.lang, { new_key: 'Brand New Value' });

    expect(dictionaryChanged).toBeTrue();
    expect(service.stateVersion()).toBeGreaterThan(initialVersion);
    expect(service.translate('new_key')).toBe('Brand New Value');
    expect(signalResult()).toBe('Brand New Value');
    expect(observableValues).toEqual(['new_key', 'Brand New Value']);

    obsSub.unsubscribe();
    dicSub.unsubscribe();
  });
});