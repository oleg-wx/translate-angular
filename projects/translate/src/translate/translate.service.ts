import { computed, Inject, Injectable, InjectionToken, isSignal, Optional, Signal, signal } from '@angular/core';
import { BehaviorSubject, combineLatest, isObservable, map, merge, Observable, of, Subject } from 'rxjs';
import {
  Translations,
  Dictionary,
  SimplePipeline,
  PlaceholderType,
  TranslateDynamicProps,
  TranslateKey,
  Dictionaries,
  DictionaryEntry,
} from 'simply-translate';
import { FallbackWithDifferentLanguageMiddleware } from 'simply-translate/es/core/middleware/fallback-with-different-language-middleware';

export interface DefaultTranslateConfig {
  lang?: string;
  fallbackLang?: string;
  placeholder?: PlaceholderType;
}

interface LangChange {
  lang: string;
  oldLang?: string;

  /** @deprecated */
  fallbackLang?: string;
}

export abstract class TranslateServiceBase {
  abstract get lang(): string | undefined;
  abstract get fallbackLang(): string | undefined;

  abstract translateTo(lang: string, key: TranslateKey): string;
  abstract translateTo(lang: string, key: TranslateKey, fallback: string): string;
  abstract translateTo(lang: string, key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): string;
  abstract translateTo(lang: string, key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: DictionaryEntry | string): string;

  abstract translate(key: TranslateKey): string;
  abstract translate(key: TranslateKey, fallback: string): string;
  abstract translate(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): string;
  abstract translate(key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: DictionaryEntry | string): string;

  abstract translateSignal(key: TranslateKey): Signal<string>;
  abstract translateSignal(key: TranslateKey, fallback: string): Signal<string>;
  abstract translateSignal(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): Signal<string>;
  abstract translateSignal(key: TranslateKey, dynamicValues: Signal<TranslateDynamicProps>, fallback?: DictionaryEntry | string): Signal<string>;
  abstract translateSignal(key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: DictionaryEntry | string): Signal<string>;

  abstract translateObservable(key: TranslateKey): Observable<string>;
  abstract translateObservable(key: TranslateKey, fallback: string): Observable<string>;
  abstract translateObservable(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): Observable<string>;
  abstract translateObservable(key: TranslateKey, dynamicValues: Observable<TranslateDynamicProps>, fallback?: DictionaryEntry | string): Observable<string>;
  abstract translateObservable(
    key: TranslateKey,
    dynamicValuesOrFallback?: Observable<TranslateDynamicProps> | TranslateDynamicProps | string,
    fallback?: DictionaryEntry | string,
  ): Observable<string>;

  abstract extendDictionary(lang: string, dictionary: Dictionary): void;
}

export const DEFAULT_CONFIG = new InjectionToken<DefaultTranslateConfig>('TranslateService DEFAULT_CONFIG');
export const ROOT_DICTIONARIES = new InjectionToken<Dictionaries>('TranslateService INITIAL_DICTIONARIES');

@Injectable()
export class TranslateRootService implements TranslateServiceBase {
  private _fallbackAdded = false;

  private _langChangeSubj: BehaviorSubject<LangChange>;
  private _dictionarySubj: Subject<void>;
  private _service: Translations;

  private readonly _stateVersionSubs = new BehaviorSubject<number>(0);

  public languageChange$: Observable<LangChange>;
  public dictionaryChange$: Observable<void>;

  public readonly stateVersion$ = this._stateVersionSubs.asObservable();

  public readonly stateVersion = signal(0);

  private _bumpStateVersion() {
    const next = this._stateVersionSubs.value + 1;
    this._stateVersionSubs.next(next);
    this.stateVersion.set(next);
  }

  public get pipeline() {
    return this._service.pipeline as SimplePipeline;
  }

  public set lang(lang: string | undefined) {
    if (this._service.lang === lang) {
      return;
    }
    const oldLang = this._service.lang;
    this._service.lang = lang;
    this._langChangeSubj.next({ lang: this.lang, oldLang: oldLang, fallbackLang: this.fallbackLang });
  }

  public get lang(): string | undefined {
    return this._service.lang;
  }

  public set fallbackLang(lang: string | undefined) {
    if (this._service.lang === lang || this._service.fallbackLang === lang) {
      return;
    }

    this._service.fallbackLang = lang;
    this._addFallbackLangMiddleware(this.pipeline, lang);
  }

  public get fallbackLang(): string | undefined {
    return this._service.fallbackLang;
  }

  constructor(@Optional() @Inject(DEFAULT_CONFIG) config?: DefaultTranslateConfig, @Optional() @Inject(ROOT_DICTIONARIES) rootDictionaries?: Dictionaries) {
    this._langChangeSubj = new BehaviorSubject<LangChange>({ lang: config?.lang ?? '' });
    this.languageChange$ = this._langChangeSubj.asObservable();
    this._dictionarySubj = new Subject<void>();
    this.dictionaryChange$ = this._dictionarySubj.asObservable();

    const pipeline = new SimplePipeline();

    this._addFallbackLangMiddleware(pipeline, config?.fallbackLang);

    this._service = new Translations(
      rootDictionaries ?? {},
      { placeholder: config?.placeholder, lang: config?.lang, fallbackLang: config?.fallbackLang },
      pipeline,
    );

    merge(this._langChangeSubj, this._dictionarySubj).subscribe(() => this._bumpStateVersion());
  }

  translateTo(lang: string, key: TranslateKey): string;
  translateTo(lang: string, key: TranslateKey, fallback: string): string;
  translateTo(lang: string, key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): string;
  translateTo(lang: string, key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: DictionaryEntry | string): string {
    return this._service.translateTo(lang, key, dynamicValuesOrFallback as any, fallback);
  }

  translate(key: TranslateKey): string;
  translate(key: TranslateKey, fallback: string): string;
  translate(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): string;
  translate(key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: DictionaryEntry | string): string {
    return this._service.translate(key, dynamicValuesOrFallback as any, fallback);
  }

  translateSignal(key: TranslateKey): Signal<string>;
  translateSignal(key: TranslateKey, fallback: string): Signal<string>;
  translateSignal(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): Signal<string>;
  translateSignal(key: TranslateKey, dynamicValues: Signal<TranslateDynamicProps>, fallback?: DictionaryEntry | string): Signal<string>;
  translateSignal(
    key: TranslateKey,
    dynamicValuesOrFallback?: TranslateDynamicProps | string | Signal<any>,
    fallback?: DictionaryEntry | string,
  ): Signal<string> {
    return computed(
      () => {
        this.stateVersion();
        const unwrappedParams = isSignal(dynamicValuesOrFallback) ? dynamicValuesOrFallback() : dynamicValuesOrFallback;
        return this._service.translate(key, unwrappedParams as any, fallback);
      },
      {
        equal: (a, b) => a === b,
      },
    );
  }

  translateObservable(key: TranslateKey): Observable<string>;
  translateObservable(key: TranslateKey, fallback: string): Observable<string>;
  translateObservable(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): Observable<string>;
  translateObservable(key: TranslateKey, dynamicValues: Observable<TranslateDynamicProps>, fallback?: DictionaryEntry | string): Observable<string>;
  translateObservable(
    key: TranslateKey,
    dynamicValuesOrFallback?: Observable<TranslateDynamicProps> | TranslateDynamicProps | string,
    fallback?: DictionaryEntry | string,
  ): Observable<string> {
    const params$: Observable<any> = isObservable(dynamicValuesOrFallback) ? dynamicValuesOrFallback : of(dynamicValuesOrFallback);

    return combineLatest([this.stateVersion$, params$]).pipe(
      map(([_, unwrappedParams]) => {
        return this._service.translate(key, unwrappedParams, fallback);
      }),
    );
  }

  extendDictionary(lang: string, dictionary: Dictionary) {
    this._service.extendDictionary(lang, dictionary);
    this._dictionarySubj.next();
  }

  hasTranslation(key: TranslateKey) {
    return this._service.hasTranslation(key);
  }

  hasTranslationTo(lang: string, key: TranslateKey) {
    return this._service.hasTranslationTo(lang, key);
  }

  private _addFallbackLangMiddleware(pipeline: SimplePipeline, fallbackLang: string | undefined) {
    if (fallbackLang && !this._fallbackAdded) {
      this._fallbackAdded = true;
      pipeline.addMiddlewareAt(2, FallbackWithDifferentLanguageMiddleware);
    }
  }
}

export interface TranslateChildConfig {
  id?: string;
  dictionaries?: Dictionaries;
  loadDictionaries?: (opts: { lang: string; fallbackLang: string }, ...deps: any[]) => Observable<Dictionaries>;
  deps?: any[];
}

export const TRANSLATE_CHILD = new InjectionToken<TranslateChildConfig>('TranslateService TRANSLATE_CHILD');

@Injectable()
export class TranslateService implements TranslateServiceBase {
  private _id: string | undefined;
  readonly languageChange$ = this._root.languageChange$;
  readonly dictionaryChange$ = this._root.dictionaryChange$;

  stateVersion = computed(() => this._root.stateVersion());

  public get lang(): string | undefined {
    return this._root.lang;
  }

  public get fallbackLang(): string | undefined {
    return this._root.fallbackLang;
  }

  constructor(
    private _root: TranslateRootService,
    @Optional() @Inject(TRANSLATE_CHILD) _options?: TranslateChildConfig,
  ) {
    this._id = _options?.id;

    if (_options?.dictionaries) {
      Object.keys(_options.dictionaries).forEach((lang) => {
        this.extendDictionary(lang, _options.dictionaries?.[lang] ?? {});
      });
    }
  }

  translateTo(lang: string, key: TranslateKey): string;
  translateTo(lang: string, key: TranslateKey, fallback: string): string;
  translateTo(lang: string, key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): string;
  translateTo(lang: string, key: TranslateKey, dynamicValuesOrFallback?: string | TranslateDynamicProps, fallback?: DictionaryEntry | string): string {
    return this._root.translateTo(lang, this.getChildKey(key), dynamicValuesOrFallback as any, fallback);
  }

  translate(key: TranslateKey): string;
  translate(key: TranslateKey, fallback: string): string;
  translate(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): string;
  translate(key: TranslateKey, dynamicValuesOrFallback?: string | TranslateDynamicProps, fallback?: DictionaryEntry | string): string {
    return this._root.translate(this.getChildKey(key), dynamicValuesOrFallback as any, fallback);
  }

  translateSignal(key: TranslateKey): Signal<string>;
  translateSignal(key: TranslateKey, fallback: string): Signal<string>;
  translateSignal(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): Signal<string>;
  translateSignal(key: TranslateKey, dynamicValues: Signal<TranslateDynamicProps>, fallback?: DictionaryEntry | string): Signal<string>;
  translateSignal(
    key: TranslateKey,
    dynamicValuesOrFallback?: Signal<any> | TranslateDynamicProps | string,
    fallback?: DictionaryEntry | string,
  ): Signal<string> {
    return this._root.translateSignal(this.getChildKey(key), dynamicValuesOrFallback as any, fallback);
  }

  translateObservable(key: TranslateKey): Observable<string>;
  translateObservable(key: TranslateKey, fallback: string): Observable<string>;
  translateObservable(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): Observable<string>;
  translateObservable(key: TranslateKey, dynamicValues: Observable<TranslateDynamicProps>, fallback?: DictionaryEntry | string): Observable<string>;
  translateObservable(
    key: TranslateKey,
    dynamicValuesOrFallback?: Observable<TranslateDynamicProps> | TranslateDynamicProps | string,
    fallback?: DictionaryEntry | string,
  ): Observable<string> {
    return this._root.translateObservable(this.getChildKey(key), dynamicValuesOrFallback as any, fallback);
  }

  extendDictionary(lang: string, dictionary: Dictionary) {
    if (!this._id) {
      this._root.extendDictionary(lang, dictionary);
    } else {
      this._root.extendDictionary(lang, { [this._id]: dictionary });
    }
  }

  private getChildKey(key: TranslateKey) {
    if (!this._id) return key;

    let _key: any;

    if (typeof key === 'string') {
      _key = `${this._id}.${key}`;
    } else {
      _key = [this._id, ...key];
    }

    if (this._root['_service'].dictionaries[this.lang][this._id] !== undefined) {
      if (this._root.hasTranslation(_key)) {
        return _key;
      } else {
        return key;
      }
    }

    return key;
  }
}
