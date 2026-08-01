import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TranslateRootService } from '../public_api';
import { TranslateModule } from '../simply-translate.module';
import { TranslateLoader, TranslateLoaderDictionaries } from '../translate/loader/translate.loader';
import { TranslateLoaderCache } from '../translate/loader/translate.loader-cache';
import { TranslateService } from '../translate/translate.service';
import { tick } from './core/tick';

const lang = 'lang';
const newLang = 'new';

describe('TranslateLoader', () => {
  let root: TranslateRootService;
  let httpMock: HttpTestingController;

  function createLoader(id: string, dictionaries: TranslateLoaderDictionaries): TranslateLoader {
    const loader = new TranslateLoader(TestBed.inject(TranslateLoaderCache), TestBed.inject(HttpClient), TestBed.inject(TranslateService), id, dictionaries);
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
