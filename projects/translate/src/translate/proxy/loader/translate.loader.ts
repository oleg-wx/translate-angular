import { from, Observable, shareReplay, Subject, Subscription } from 'rxjs';
import { Dictionary } from 'simply-translate';
import { TranslateService } from '../../translate.service';
import { TranslateLoaderCache } from './translate.loader-cache';
import { HttpClient } from '@angular/common/http';

export type TranslateLoaderDictionary = Dictionary | Promise<Dictionary> | Observable<Dictionary> | string;
export type TranslateLoaderDictionaries = Record<string, TranslateLoaderDictionary>;

export interface TranslateLoaderSupport{
  applyLoader(): { id: string; dictionaries: TranslateLoaderDictionaries };
  onLoaderError?(args: { lang: string; id: string; error: any }): void;
}

export class TranslateLoader {
  constructor(
    private cache: TranslateLoaderCache,
    private httpClient: HttpClient,
    private service: TranslateService,
    readonly id: string,
    readonly dictionaries: TranslateLoaderDictionaries,
  ) {}

  private _subs?: Subscription;
  readonly _errorsSub = new Subject<{ lang: string; id: string; error: any }>();
  readonly errors$ = this._errorsSub.asObservable();

  init() {
    if (!this._subs && this.service.lang && this.dictionaries[this.service.lang]) {
      this.importLang(this.service.lang, this.id);
    }

    this._subs = this.service.languageChange$.pipe().subscribe((_lang) => {
      const lang = _lang.lang;
      this.importLang(lang, this.id);
    });
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

      return;
    }

    const source = typeof dic === 'string' ? this.httpClient.get<Dictionary>(dic) : from(dic);
    const load = this.cache.set(lang, this.id, source.pipe(shareReplay(1)));

    load.subscribe({
      next: (dictionary) => {
        this.cache.set(lang, this.id, dictionary);
        this.service.extendDictionary(lang, dictionary);
      },
      error: (error) => {
        this.cache.clear(lang, this.id);
        this._errorsSub.next({ lang, id, error });
      },
    });
  }
}
