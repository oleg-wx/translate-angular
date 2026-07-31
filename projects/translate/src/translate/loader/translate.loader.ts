import { from, Observable, shareReplay, Subscription } from 'rxjs';
import { Dictionary } from 'simply-translate';
import { TranslateService } from '../translate.service';
import { TranslateLoaderCache } from './translate.loader-cache';
import { HttpClient } from '@angular/common/http';

export type TranslateLoaderDictionary = Dictionary | Promise<Dictionary> | Observable<Dictionary> | string;
export type TranslateLoaderDictionaries = Record<string, TranslateLoaderDictionary>;

export class TranslateLoader {
  constructor(
    private cache: TranslateLoaderCache,
    private httpClient: HttpClient,
    private service: TranslateService,
    readonly id: string,
    readonly dictionaries: TranslateLoaderDictionaries,
  ) {}
  private _subs?: Subscription;

  init() {
    if (!this._subs && this.service.lang && this.dictionaries[this.service.lang]) {
      this.importLang(this.service.lang, this.id);
    }

    this._subs = this.service.languageChange$.pipe().subscribe((_lang) => {
      const lang = _lang.lang;
      this.importLang(lang, this.id);
    });
  }

  remove(){
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

    // Already resolved to a dictionary, or a load is still in flight — either way, don't start another.
    // (On error the entry is cleared below, so a later call retries.)
    if (cached) {
      return;
    }

    // Synchronous inline dictionary — graft immediately.
    if (!(typeof dic === 'string' || dic instanceof Promise || dic instanceof Observable)) {
      this.cache.set(lang, this.id, dic);
      this.service.extendDictionary(lang, dic);

      return;
    }

    // Async source (URL string | Promise | Observable) — normalise to a single shared stream so
    // concurrent consumers (and the resolver via getProcess()) don't trigger duplicate loads.
    const source = typeof dic === 'string' ? this.httpClient.get<Dictionary>(dic) : from(dic);
    const load = this.cache.set(lang, this.id, source.pipe(shareReplay(1)));

    load.subscribe({
      next: (dictionary) => {
        this.cache.set(lang, this.id, dictionary);
        this.service.extendDictionary(lang, dictionary);
      },
      error: (error) => {
        // Clear the in-flight entry so a subsequent attempt (e.g. re-selecting the language) retries,
        // instead of being permanently short-circuited by a cached failed load.
        this.cache.clear(lang, this.id);
        // eslint-disable-next-line no-console -- deliberate surfacing of a runtime dictionary-load failure
        console.error(`[TranslateLoader] Failed to load dictionary '${this.id}' (${lang}):`, error);
      },
    });
  }
}
