import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TranslateLoaderCache, TranslateLoaderDictionaries, TranslateRootService } from '../public_api';
import { TranslateModule } from '../simply-translate.module';
import { TranslateService } from '../translate/translate.service';
import { tick } from './core/tick';
import { TranslateLoader } from '../translate/proxy/loader/translate.loader';

const lang = 'lang';
const newLang = 'new';

describe('TranslateLoader', () => {
  let root: TranslateRootService;
  let httpMock: HttpTestingController;

  function createLoader(id: string, dictionaries: TranslateLoaderDictionaries, preloadLangs?: string[]): TranslateLoader {
    const loader = new TranslateLoader(
      TestBed.inject(TranslateLoaderCache),
      TestBed.inject(HttpClient),
      TestBed.inject(TranslateService),
      id,
      dictionaries,
      preloadLangs,
    );
    loader.init();
    return loader;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot({ lang })],
    });

    root = TestBed.inject(TranslateRootService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('grafts a plain-object dictionary onto the current language immediately', () => {
    createLoader('id1', { [lang]: { hello_user: 'Hello ${user}' } });

    expect(root.translate('hello_user', { user: 'Oleg' })).toBe('Hello Oleg');
  });

  it('caches the resolved dictionary so getProcess returns it', () => {
    const dict = { hello_user: 'Hello ${user}' };
    const loader = createLoader('id1', { [lang]: dict });

    expect(loader.getProcess()).toBe(dict);
  });

  it('resolves a Promise source and grafts it once resolved', async () => {
    createLoader('id1', { [lang]: Promise.resolve({ hello_user: 'Hello ${user}' }) });

    await tick(0);

    expect(root.translate('hello_user', { user: 'Oleg' })).toBe('Hello Oleg');
  });

  it('resolves an Observable source and grafts it once it emits', () => {
    const dict$ = new Subject<Record<string, string>>();
    createLoader('id1', { [lang]: dict$ });

    expect(root.translate('hello_user', { user: 'Oleg' })).toBe('hello_user');

    dict$.next({ hello_user: 'Hello ${user}' });

    expect(root.translate('hello_user', { user: 'Oleg' })).toBe('Hello Oleg');
  });

  it('fetches a URL source via HttpClient and grafts the response', () => {
    createLoader('id1', { [lang]: '/assets/id1.json' });

    httpMock.expectOne('/assets/id1.json').flush({ hello_user: 'Hello ${user}' });

    expect(root.translate('hello_user', { user: 'Oleg' })).toBe('Hello Oleg');
  });

  it('does not start a second request while one is already cached/in-flight for the same id+lang', () => {
    createLoader('id1', { [lang]: '/assets/id1.json' });
    createLoader('id1', { [lang]: '/assets/id1.json' });

    const requests = httpMock.match('/assets/id1.json');
    expect(requests.length).toBe(1);
    requests[0].flush({ hello_user: 'Hello ${user}' });
  });

  it('merges distinct ids into the same shared per-language dictionary (no id namespacing)', () => {
    createLoader('id1', { [lang]: { greeting_from_id1: 'From id1' } });
    createLoader('id2', { [lang]: { greeting_from_id2: 'From id2' } });

    // Both land in the same flat dictionary for `lang` — unlike TranslateService.extendDictionary()
    // for forChild(), TranslateLoader does not prefix keys by id, so distinct ids must use distinct keys.
    expect(root.translate('greeting_from_id1')).toBe('From id1');
    expect(root.translate('greeting_from_id2')).toBe('From id2');
  });

  it('loads the dictionary for the newly selected language on language change', () => {
    createLoader('id1', {
      [lang]: { hello_user: 'Hello ${user}' },
      [newLang]: { hello_user: 'Hello New ${user}' },
    });

    root.lang = newLang;

    expect(root.translate('hello_user', { user: 'Oleg' })).toBe('Hello New Oleg');
  });

  it('fetches the new language over HTTP only after switching to it', () => {
    createLoader('id1', {
      [lang]: { hello_user: 'Hello ${user}' },
      [newLang]: '/assets/id1.new.json',
    });

    httpMock.expectNone('/assets/id1.new.json');

    root.lang = newLang;

    httpMock.expectOne('/assets/id1.new.json').flush({ hello_user: 'Hello New ${user}' });

    expect(root.translate('hello_user', { user: 'Oleg' })).toBe('Hello New Oleg');
  });

  it('stops reacting to language changes once removed', () => {
    const loader = createLoader('id1', {
      [lang]: { hello_user: 'Hello ${user}' },
      [newLang]: '/assets/id1.new.json',
    });

    loader.remove();
    root.lang = newLang;

    expect(httpMock.match('/assets/id1.new.json').length).toBe(0);
  });

  it('does not load any other language on its own — only the active one', () => {
    createLoader('id1', {
      [lang]: { hello_user: 'Hello ${user}' },
      [newLang]: '/assets/id1.new.json',
    });

    expect(httpMock.match('/assets/id1.new.json').length).toBe(0);
  });

  describe('preloadLangs (declared upfront via applyLoader)', () => {
    it('loads every declared language immediately, not just the active one', () => {
      createLoader(
        'id1',
        {
          [lang]: { hello_user: 'Hello ${user}' },
          [newLang]: { hello_user: 'Hello Preloaded ${user}' },
        },
        [newLang],
      );

      // `newLang` is available immediately, without switching to it.
      expect(root.translateTo(newLang, 'hello_user', { user: 'Oleg' })).toBe('Hello Preloaded Oleg');
    });

    it('fetches every declared language over HTTP upfront, alongside the active language', () => {
      createLoader(
        'id1',
        {
          [lang]: '/assets/id1.json',
          [newLang]: '/assets/id1.preload.json',
        },
        [newLang],
      );

      httpMock.expectOne('/assets/id1.json').flush({ hello_user: 'Hello ${user}' });
      httpMock.expectOne('/assets/id1.preload.json').flush({ hello_user: 'Hello Preloaded ${user}' });

      expect(root.translateTo(newLang, 'hello_user', { user: 'Oleg' })).toBe('Hello Preloaded Oleg');
    });

    it('does not try to load a declared language the proxy has no dictionary for', () => {
      createLoader('id1', { [lang]: { hello_user: 'Hello ${user}' } }, [newLang]);

      expect(httpMock.match('/assets/id1.preload.json').length).toBe(0);
    });
  });

  describe('preloadLang() (ad hoc, called explicitly)', () => {
    it('loads a language on demand without switching to it', () => {
      const loader = createLoader('id1', {
        [lang]: { hello_user: 'Hello ${user}' },
        [newLang]: { hello_user: 'Hello Preloaded ${user}' },
      });

      loader.preloadLang(newLang);

      expect(root.translateTo(newLang, 'hello_user', { user: 'Oleg' })).toBe('Hello Preloaded Oleg');
    });

    it('is a no-op for a language the loader has no dictionary for', () => {
      const loader = createLoader('id1', { [lang]: { hello_user: 'Hello ${user}' } });

      loader.preloadLang(newLang);

      expect(httpMock.match('/assets/id1.new.json').length).toBe(0);
    });
  });

  describe('ready$', () => {
    it('emits once a language is grafted synchronously', () => {
      // Constructed but not init()'d yet, so we can subscribe before the synchronous initial load fires.
      const loader = new TranslateLoader(
        TestBed.inject(TranslateLoaderCache),
        TestBed.inject(HttpClient),
        TestBed.inject(TranslateService),
        'id1',
        { [lang]: { hello_user: 'Hello ${user}' } },
      );
      const ready: { lang: string; id: string }[] = [];
      loader.ready$.subscribe((e) => ready.push(e));

      loader.init();
      loader.preloadLang(newLang);
      // Nothing to report for `newLang` — no dictionary declared for it — only the initial load fires.

      expect(ready).toEqual([{ lang, id: 'id1' }]);
    });

    it('emits once an async source resolves', () => {
      const loader = createLoader('id1', { [lang]: '/assets/id1.json' });
      const ready: { lang: string; id: string }[] = [];
      loader.ready$.subscribe((e) => ready.push(e));

      httpMock.expectOne('/assets/id1.json').flush({ hello_user: 'Hello ${user}' });

      expect(ready).toEqual([{ lang, id: 'id1' }]);
    });
  });

  it('clears the cache on a failed load so a later attempt retries', () => {
    const failed = createLoader('id1', { [lang]: '/assets/id1.json' });
    const errors: { lang: string; id: string; error: unknown }[] = [];
    failed.errors$.subscribe((e) => errors.push(e));

    httpMock.expectOne('/assets/id1.json').error(new ProgressEvent('error'));

    expect(failed.getProcess()).toBeUndefined();
    expect(errors.length).toBe(1);
    expect(errors[0].lang).toBe(lang);
    expect(errors[0].id).toBe('id1');

    createLoader('id1', { [lang]: '/assets/id1.json' });
    httpMock.expectOne('/assets/id1.json').flush({ hello_user: 'Hello ${user}' });

    expect(root.translate('hello_user', { user: 'Oleg' })).toBe('Hello Oleg');
  });
});
