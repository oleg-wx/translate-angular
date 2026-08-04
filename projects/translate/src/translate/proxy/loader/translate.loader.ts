import { from, Observable, shareReplay, Subject, Subscription } from 'rxjs';
import { Dictionary } from 'simply-translate';
import { TranslateService } from '../../translate.service';
import { TranslateLoaderCache } from './translate.loader-cache';
import { HttpClient } from '@angular/common/http';

export type TranslateLoaderDictionary = Dictionary | Promise<Dictionary> | Observable<Dictionary> | string;
export type TranslateLoaderDictionaries = Record<string, TranslateLoaderDictionary>;

export interface TranslateLoaderSupport{
  applyLoader(): { id: string; dictionaries: TranslateLoaderDictionaries; preloadLangs?: string[] };
  onLoaderReady?(args: { lang: string; id: string }): void;
  onLoaderError?(args: { lang: string; id: string; error: any }): void;
}

export class TranslateLoader {
  constructor(
    private cache: TranslateLoaderCache,
    private httpClient: HttpClient,
    private service: TranslateService,
    readonly id: string,
    readonly dictionaries: TranslateLoaderDictionaries,
    readonly preloadLangs: readonly string[] = [],
  ) {}

  private _subs?: Subscription;
  readonly _readySub = new Subject<{ lang: string; id: string }>();
  readonly ready$ = this._readySub.asObservable();
  readonly _errorsSub = new Subject<{ lang: string; id: string; error: any }>();
  readonly errors$ = this._errorsSub.asObservable();

  init() {
    if (!this._subs) {
      this.preloadLang(this.service.lang);
      this.preloadLangs.forEach((lang) => this.preloadLang(lang));
    }

    this._subs = this.service.languageChange$.pipe().subscribe((_lang) => {
      this.preloadLang(_lang.lang);
    });
  }

  /**
   * Loads this loader's dictionary for `lang` right away, without waiting for the app to switch to it —
   * e.g. the fallback language, or any other language you want warmed up ahead of time. A no-op if this
   * loader has no dictionary declared for `lang`, or it's already loaded/in-flight.
   */
  preloadLang(lang: string | undefined): void {
    if (lang && this.dictionaries[lang]) {
      this.importLang(lang, this.id);
    }
  }

  remove() {
    this._subs?.unsubscribe();
    this._subs = undefined;
  }

  getProcess() {
    const lang = this.service.lang;
    if (!lang) {
      return undefined;
    }

    return this.cache.get(lang, this.id);
  }

  private importLang(lang: string, id: string): void {
    const dic = this.dictionaries[lang];
    const cached = this.cache.get(lang, this.id);

    if (cached) {
      return;
    }

    if (!(typeof dic === 'string' || dic instanceof Promise || dic instanceof Observable)) {
      this.cache.set(lang, this.id, dic);
      this.service.extendDictionary(lang, dic);
      this._readySub.next({ lang, id });

      return;
    }

    const source = typeof dic === 'string' ? this.httpClient.get<Dictionary>(dic) : from(dic);
    const load = this.cache.set(lang, this.id, source.pipe(shareReplay(1)));

    load.subscribe({
      next: (dictionary) => {
        this.cache.set(lang, this.id, dictionary);
        this.service.extendDictionary(lang, dictionary);
        this._readySub.next({ lang, id });
      },
      error: (error) => {
        this.cache.clear(lang, this.id);
        this._errorsSub.next({ lang, id, error });
      },
    });
  }
}
