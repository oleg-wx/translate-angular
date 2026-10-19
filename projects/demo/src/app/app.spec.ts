import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslateRootService } from 'src/_translate.imports';
import { appConfig } from './app.config';
import { DynamicComponent } from './dynamic/dynamic.component';
import { DynamicComponent as AnotherDynamicComponent } from './another-dynamic/dynamic.component';
import { TranslateProxyMore } from './try-proxy/translate.proxy';

import enUS from '../assets/translations/en-US.json';
import ruRU from '../assets/translations/ru-RU.json';
import enUSDynamic from '../assets/translations/en-US.dynamic.json';
import ruRUDynamic from '../assets/translations/ru-RU.dynamic.json';
import enUSOther from '../assets/translations/en-US.other-dynamic.json';
import ruRUOther from '../assets/translations/ru-RU.other-dynamic.json';

const ROOT_DICTIONARIES: Record<string, unknown> = {
  '/assets/translations/en-US.json': enUS,
  '/assets/translations/ru-RU.json': ruRU,
  '/assets/translations/en-US.dynamic.json': enUSDynamic,
  '/assets/translations/ru-RU.dynamic.json': ruRUDynamic,
  '/assets/translations/en-US.other-dynamic.json': enUSOther,
  '/assets/translations/ru-RU.other-dynamic.json': ruRUOther,
};

describe('demo application wiring', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  /** Answers every dictionary request the application has made so far. */
  function flushDictionaries() {
    http.match(() => true).forEach((request) => {
      const body = ROOT_DICTIONARIES[request.request.url];
      expect(body).withContext(`unexpected request ${request.request.url}`).toBeDefined();
      request.flush(body);
    });
  }

  /**
   * Navigates and keeps answering dictionary requests until the navigation settles —
   * the lazy chunk, the child providers and the resolver each take a turn of their own.
   */
  async function navigate<T>(url: string, component: new (...args: any[]) => T): Promise<T> {
    let settled = false;
    const navigation = harness.navigateByUrl(url, component).then((instance) => ((settled = true), instance));

    for (let i = 0; i < 50 && !settled; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      flushDictionaries();
    }

    return navigation;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });

    // injecting creates the test module, which runs the APP_INITIALIZER
    http = TestBed.inject(HttpTestingController);
    flushDictionaries();
    await TestBed.inject(ApplicationInitStatus).donePromise;

    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  it('loads the root dictionaries during initialization', () => {
    expect(TestBed.inject(TranslateRootService).translate('welcome_to_app')).toBe('Welcome to Translation Testing Application');
    expect(TestBed.inject(TranslateRootService).translate('same_key')).toBe('Same in the Root');
  });

  it('gives the proxies the TranslateService that provideTranslate() registered', () => {
    // fails with NullInjectorError when the demo and the proxy package load different copies of the library
    expect(() => TestBed.inject(TranslateProxyMore)).not.toThrow();
    http.match((request) => request.url.startsWith('/assets/translations/proxy/')).forEach((request) => request.flush({}));
  });

  it('scopes the lazy "dynamic" route to its own dictionary', async () => {
    await navigate('/dynamic', DynamicComponent);
    harness.detectChanges();

    const text = harness.routeNativeElement!.textContent!;
    expect(text).toContain('Same in the Dynamic');
    expect(text).toContain('Same Dic');
    // keys the scope does not define still come from the root
    expect(text).toContain('Only in the Root');
  });

  it('scopes the lazy "another-dynamic" route to its own dictionary', async () => {
    await navigate('/another-dynamic', AnotherDynamicComponent);
    harness.detectChanges();

    const text = harness.routeNativeElement!.textContent!;
    expect(text).toContain('Same in another Dynamic');
    expect(text).toContain('Same other Dic');
    expect(text).toContain('Only in the Root');
  });
});
