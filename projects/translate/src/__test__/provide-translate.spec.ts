import { ApplicationInitStatus, Component, createEnvironmentInjector, EnvironmentInjector, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, concat, debounceTime, EMPTY, NEVER, of } from 'rxjs';
import {
  DEFAULT_CONFIG,
  Dictionaries,
  TranslateModule,
  provideTranslate,
  provideTranslateChild,
  ROOT_DICTIONARIES,
  TranslateRootService,
  TranslateService,
  TRANSLATE_IMPORTS,
  withConfig,
  withDictionaries,
  withLoader,
  withMiddleware,
  withOnReady,
} from '../public_api';
import { InjectedTestClass, InjectedValue, INJECTED_TOKEN } from './core/test.component';

@Component({
  // nested, the form the README documents
  imports: [TRANSLATE_IMPORTS],
  template: `<span id="pipe">{{ 'hello_user' | translate }}</span><span id="directive" translate="hello_user"></span>`,
})
class StandaloneTestComponent {}

/** `TestBed.inject()` creates the test module, which runs the `APP_INITIALIZER`s. */
function whenInitialized(): Promise<unknown> {
  return TestBed.inject(ApplicationInitStatus).donePromise;
}

describe('provideTranslate', () => {
  it('applies the config passed as the first argument', () => {
    TestBed.configureTestingModule({ providers: [provideTranslate({ lang: 'test', fallbackLang: 'fallback' })] });

    const service = TestBed.inject(TranslateRootService);
    expect(service.lang).toBe('test');
    expect(service.fallbackLang).toBe('fallback');
  });

  it('defaults the placeholder to "default"', () => {
    TestBed.configureTestingModule({ providers: [provideTranslate()] });

    expect(TestBed.inject(DEFAULT_CONFIG).placeholder).toBe('default');
    expect(TestBed.inject(ROOT_DICTIONARIES)).toEqual({});
  });

  it('accepts features instead of a config object', () => {
    TestBed.configureTestingModule({
      providers: [provideTranslate(withConfig({ lang: 'test' }), withDictionaries({ test: { hello_user: 'Hello User' } }))],
    });

    expect(TestBed.inject(TranslateRootService).translate('hello_user')).toBe('Hello User');
  });

  it('rejects a feature that may only be used once', () => {
    expect(() => provideTranslate(withConfig({ lang: 'a' }), withConfig({ lang: 'b' }))).toThrowError(/withConfig\(\) can only be used once/);
  });

  it('rejects a child scope without a root', () => {
    TestBed.configureTestingModule({ providers: [provideTranslateChild({ id: 'child' })] });

    expect(() => TestBed.inject(TranslateService)).toThrowError(/requires provideTranslate\(\)/);
  });

  describe('initialization', () => {
    let order: string[];

    beforeEach(async () => {
      order = [];

      TestBed.configureTestingModule({
        providers: [
          { provide: INJECTED_TOKEN, useValue: { value: 0 } },
          provideTranslate(
            { lang: 'test', fallbackLang: 'fallback' },
            withDictionaries({ test: { from_dictionaries: 'root' } }),
            withMiddleware(() => {
              order.push('middleware');
              inject(InjectedTestClass).value++;
              inject<InjectedValue>(INJECTED_TOKEN).value++;
              return [];
            }),
            withLoader(({ lang, fallbackLang }) => {
              order.push(`loader-a:${lang}:${fallbackLang}`);
              inject(InjectedTestClass).value++;
              return of({ test: { from_loader_a: 'a' } }).pipe(debounceTime(10));
            }),
            // a plain object is as good as an observable
            withLoader(() => {
              order.push('loader-b');
              return { test: { from_loader_b: 'b' } };
            }),
            withOnReady(() => {
              order.push('onReady');
              inject(InjectedTestClass).value++;
            }),
          ),
        ],
      });

      await whenInitialized();
    });

    it('runs middleware first, then the loaders, then onReady', () => {
      expect(order[0]).toBe('middleware');
      expect(order[order.length - 1]).toBe('onReady');
      expect(order).toContain('loader-a:test:fallback');
      expect(order).toContain('loader-b');
    });

    it('merges dictionaries from every source', () => {
      const service = TestBed.inject(TranslateRootService);
      expect(service.translate('from_dictionaries')).toBe('root');
      expect(service.translate('from_loader_a')).toBe('a');
      expect(service.translate('from_loader_b')).toBe('b');
    });

    it('injects dependencies inside the feature callbacks', () => {
      expect(TestBed.inject(InjectedTestClass).value).toBe(3);
      expect(TestBed.inject<InjectedValue>(INJECTED_TOKEN).value).toBe(1);
    });
  });

  describe('root guard', () => {
    it('rejects provideTranslate() in a child injector', () => {
      TestBed.configureTestingModule({ providers: [provideTranslate()] });
      const parent = TestBed.inject(EnvironmentInjector);

      expect(() => createEnvironmentInjector([provideTranslate()], parent)).toThrowError(/called more than once/);
    });

    it('lets TranslateModule.forRoot() be imported again in a lazily loaded module', () => {
      TestBed.configureTestingModule({ imports: [TranslateModule.forRoot()] });
      const parent = TestBed.inject(EnvironmentInjector);

      expect(() => createEnvironmentInjector(TranslateModule.forRoot().providers!, parent)).not.toThrow();
    });
  });

  describe('misbehaving loaders', () => {
    it('start the application with the first result of each loader', async () => {
      const repeating = new BehaviorSubject<Dictionaries>({ test: { from_repeating: 'first' } });
      let extended = 0;

      TestBed.configureTestingModule({
        providers: [
          provideTranslate(
            { lang: 'test' },
            withLoader(() => EMPTY),
            withLoader(() => concat(of({ test: { from_never_completing: 'yes' } }), NEVER)),
            withLoader(() => repeating),
            withOnReady(() => {
              const service = inject(TranslateRootService);
              service.dictionaryChange$.subscribe(() => extended++);
            }),
          ),
        ],
      });

      await whenInitialized();
      repeating.next({ test: { from_repeating: 'second' } });

      const service = TestBed.inject(TranslateRootService);
      expect(service.translate('from_never_completing')).toBe('yes');
      expect(service.translate('from_repeating')).toBe('first');
      expect(extended).toBe(0);
    });
  });

  describe('declarables', () => {
    it('work in a standalone component through TRANSLATE_IMPORTS', async () => {
      TestBed.configureTestingModule({
        providers: [provideTranslate({ lang: 'test' }, withDictionaries({ test: { hello_user: 'Hello User' } }))],
        imports: [StandaloneTestComponent],
      });

      const fixture = TestBed.createComponent(StandaloneTestComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      const element: HTMLElement = fixture.elementRef.nativeElement;
      expect(element.querySelector('#pipe')!.textContent).toBe('Hello User');
      expect(element.querySelector('#directive')!.textContent!.trim()).toBe('Hello User');
    });
  });
});
