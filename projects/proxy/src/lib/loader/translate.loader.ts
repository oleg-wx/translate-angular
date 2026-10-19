import { from, isObservable, Observable, shareReplay, Subject, Subscription } from 'rxjs';
import { Dictionary } from 'simply-translate';
import { TranslateService } from 'simply-translate-angular';
import { TranslateLoaderCache } from './translate.loader-cache';
import { HttpClient } from '@angular/common/http';

export type TranslateLoaderDictionary = Dictionary | Promise<Dictionary> | Observable<Dictionary> | string;
export type TranslateLoaderDictionaries = Record<string, TranslateLoaderDictionary>;

export interface TranslateLoaderSupport {
  onLoaderReady?(args: { lang: string; id: string }): void;
  onLoaderError?(args: { lang: string; id: string; error: any }): void;
}

/**
 * Internal protocol between `TranslateProxy` and `@TranslateProxyLoader`. Not part of the public API —
 * loader config is only ever meant to be supplied via the decorator, so this is a symbol rather than a
 * named method, to keep it off `TranslateLoaderSupport` and out of reach of anything but the decorator.
 */
export const APPLY_LOADER: unique symbol = Symbol('applyLoader');

export type ApplyLoaderFn = () => { id: string; dictionaries: TranslateLoaderDictionaries; preloadLangs?: string[] };

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
  /** This loader's own interest in loads; the loads themselves keep going to fill the shared cache. */
  private readonly _loads = new Subscription();
  /** Languages this loader has grafted or is loading, so each one is reported once per loader. */
  private readonly _imported = new Set<string>();
  private readonly _readySub = new Subject<{ lang: string; id: string }>();
  readonly ready$ = this._readySub.asObservable();
  private readonly _errorsSub = new Subject<{ lang: string; id: string; error: any }>();
  readonly errors$ = this._errorsSub.asObservable();

  init() {
    if (this._subs) {
      return;
    }

    this.preloadLang(this.service.lang);
    this.preloadLangs.forEach((lang) => this.preloadLang(lang));

    this._subs = this.service.languageChange$.subscribe(({ lang }) => {
      this.preloadLang(lang);
    });
  }

  /**
   * Loads this loader's dictionary for `lang` right away, without waiting for the app to switch to it —
   * e.g. the fallback language, or any other language you want warmed up ahead of time. A no-op if this
   * loader has no dictionary declared for `lang`, or it's already loaded/in-flight.
   */
  preloadLang(lang: string | undefined): void {
    if (lang && this.dictionaries[lang]) {
      this.importLang(lang);
    }
  }

  /**
   * Stops following language changes and loads in flight, and completes `ready$` and `errors$`.
   * The loader can't be reused after this.
   */
  remove() {
    this._subs?.unsubscribe();
    this._loads.unsubscribe();
    this._readySub.complete();
    this._errorsSub.complete();
  }

  getProcess() {
    const lang = this.service.lang;
    if (!lang) {
      return undefined;
    }

    return this.cache.get(lang, this.id);
  }

  private importLang(lang: string): void {
    if (this._loads.closed || this._imported.has(lang)) {
      return;
    }

    this._imported.add(lang);

    // Another loader with this id (another proxy instance, possibly on another TranslateService scope)
    // already loaded or is loading it: reuse that, but still graft it onto this loader's service.
    const cached = this.cache.get(lang, this.id);
    if (cached) {
      if (isObservable(cached)) {
        this.follow(lang, cached);
      } else {
        this.graft(lang, cached);
      }
      return;
    }

    const dic = this.dictionaries[lang];

    if (!(typeof dic === 'string' || isPromiseLike(dic) || isObservable(dic))) {
      this.cache.set(lang, this.id, dic);
      this.graft(lang, dic);
      return;
    }

    const source = typeof dic === 'string' ? this.httpClient.get<Dictionary>(dic) : from(dic);
    const load = this.cache.set(lang, this.id, source.pipe(shareReplay(1)));

    // only the loader that started the load updates the cache, so a follower can't clear a later retry
    load.subscribe({
      next: (dictionary) => this.cache.set(lang, this.id, dictionary),
      error: () => this.cache.clear(lang, this.id),
    });
    this.follow(lang, load);
  }

  private follow(lang: string, load: Observable<Dictionary>): void {
    this._loads.add(
      load.subscribe({
        next: (dictionary) => this.graft(lang, dictionary),
        error: (error) => {
          // allow preloadLang() or a later language change to retry
          this._imported.delete(lang);
          this._errorsSub.next({ lang, id: this.id, error });
        },
      }),
    );
  }

  private graft(lang: string, dictionary: Dictionary): void {
    // a copy: the first dictionary for a language is kept by reference and later ones are merged into it,
    // which would otherwise mix other ids into the cached entry, or merge it into itself when grafted again
    this.service.extendDictionary(lang, structuredClone(dictionary));
    this._readySub.next({ lang, id: this.id });
  }
}

/** Any thenable, not just this realm's `Promise`: under zone.js a native one (e.g. from `import()`) fails `instanceof Promise`. */
function isPromiseLike(value: unknown): value is PromiseLike<Dictionary> {
  return typeof (value as PromiseLike<unknown> | null)?.then === 'function';
}
