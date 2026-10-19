import { Component, createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import {
  provideTranslate,
  provideTranslateChild,
  TranslateRootService,
  TranslateService,
  TRANSLATE_IMPORTS,
  withDictionaries,
  withTranslateChild,
} from '../public_api';

@Component({
  imports: [...TRANSLATE_IMPORTS],
  template: `<span id="text">{{ 'hello_user' | translate }}</span>`,
})
class ScopedComponent {
  constructor(public service: TranslateService) {}
}

const routes: Routes = [
  {
    path: 'scoped',
    ...withTranslateChild({
      id: 'child',
      loadDictionaries: ({ lang }) => of({ [lang!]: { hello_user: 'Hello USER Child' } }),
    }),
    component: ScopedComponent,
  },
  {
    path: 'plain',
    component: ScopedComponent,
  },
];

describe('provideTranslateChild', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideTranslate({ lang: 'test', fallbackLang: 'fallback' }, withDictionaries({ test: { hello_user: 'Hello User' } })),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('prefers the scoped dictionary once the resolver has run', async () => {
    await harness.navigateByUrl('/scoped', ScopedComponent);
    harness.detectChanges();

    expect(harness.routeNativeElement!.querySelector('#text')!.textContent).toBe('Hello USER Child');
  });

  it('leaves routes without a scope on the root dictionary', async () => {
    await harness.navigateByUrl('/plain', ScopedComponent);
    harness.detectChanges();

    expect(harness.routeNativeElement!.querySelector('#text')!.textContent).toBe('Hello User');
  });

  it('gives the scoped route its own TranslateService instance', async () => {
    const scoped = await harness.navigateByUrl('/scoped', ScopedComponent);
    const scopedService = scoped.service;

    const plain = await harness.navigateByUrl('/plain', ScopedComponent);
    expect(plain.service).not.toBe(scopedService);
    expect(plain.service).toBe(TestBed.inject(TranslateService));
  });

  it('falls back to the root key when the scope has no entry for it', async () => {
    const component = await harness.navigateByUrl('/scoped', ScopedComponent);

    expect(component.service.translate('not_in_child')).toBe('not_in_child');
  });
});

describe('provideTranslateChild loading', () => {
  let harness: RouterTestingHarness;
  let calls: string[];
  let failNext: boolean;

  beforeEach(async () => {
    calls = [];
    failNext = false;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'scoped',
            ...withTranslateChild({
              id: 'child',
              loadDictionaries: ({ lang }) => {
                calls.push(lang!);
                if (failNext) {
                  failNext = false;
                  return throwError(() => new Error('offline'));
                }
                return of({ [lang!]: { hello_user: `Hello ${lang} Child` } });
              },
            }),
            component: ScopedComponent,
          },
          { path: 'plain', component: ScopedComponent },
        ]),
        provideTranslate({ lang: 'test' }, withDictionaries({ test: { hello_user: 'Hello User' } })),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('loads the scope again for a language selected later', async () => {
    const component = await harness.navigateByUrl('/scoped', ScopedComponent);

    TestBed.inject(TranslateRootService).lang = 'de';

    expect(calls).toEqual(['test', 'de']);
    expect(component.service.translate('hello_user')).toBe('Hello de Child');
  });

  it('retries a failed load on the next navigation', async () => {
    failNext = true;
    await harness.navigateByUrl('/scoped').catch(() => null);
    await harness.navigateByUrl('/plain', ScopedComponent);

    const component = await harness.navigateByUrl('/scoped', ScopedComponent);

    expect(calls).toEqual(['test', 'test']);
    expect(component.service.translate('hello_user')).toBe('Hello test Child');
  });

  it('translates without a dictionary for the current language', () => {
    const root = TestBed.inject(TranslateRootService);
    const scoped = createEnvironmentInjector([provideTranslateChild({ id: 'child' })], TestBed.inject(EnvironmentInjector)).get(TranslateService);

    root.lang = 'unknown';
    expect(scoped.translate('hello_user')).toBe('hello_user');

    root.lang = undefined;
    expect(() => scoped.translate('hello_user')).not.toThrow();
  });
});
