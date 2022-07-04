import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
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
import { TRANSLATE_CHILD, TranslateChildConfig } from './translate-child-config';

export interface DefaultTranslateConfig {
  lang?: string;
  fallbackLang?: string;
  placeholder?: PlaceholderType;
}

export const DEFAULT_CONFIG = new InjectionToken<DefaultTranslateConfig>('TranslateService DEFAULT_CONFIG');
export const ROOT_DICTIONARIES = new InjectionToken<Dictionaries>('TranslateService INITIAL_DICTIONARIES');

export abstract class TranslateServiceBase {
  abstract get lang(): string;
  abstract get fallbackLang(): string;

  abstract translateTo(lang: string, key: TranslateKey): string;
  abstract translateTo(lang: string, key: TranslateKey, fallback: string): string;
  abstract translateTo(lang: string, key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): string;
  abstract translateTo(lang: string, key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: DictionaryEntry | string): string;

  abstract translate(key: TranslateKey): string;
  abstract translate(key: TranslateKey, fallback: string): string;
  abstract translate(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: DictionaryEntry | string): string;
  abstract translate(key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: DictionaryEntry | string);

  abstract extendDictionary(lang: string, dictionary: Dictionary);
}

interface LangChange {
  lang: string;
  oldLang?: string;

  /** @deprecated */
  fallbackLang?: string;
}

@Injectable()
export class TranslateRootService implements TranslateServiceBase {
  private _fallbackAdded = false;

  private _langChangeSubj: BehaviorSubject<LangChange>;
  private _dictionarySubj: Subject<void>;
  private _service: Translations;

  public languageChange$: Observable<LangChange>;
  public dictionaryChange$: Observable<void>;

  public get pipeline() {
    return this._service.pipeline as SimplePipeline;
  }

  public set lang(lang: string) {
    if (this._service.lang === lang) {
      return;
    }
    const oldLang = this._service.lang;
    this._service.lang = lang;
    this._langChangeSubj.next({ lang: this.lang, oldLang: oldLang, fallbackLang: this.fallbackLang });
  }

  public get lang(): string {
    return this._service.lang;
  }

  public set fallbackLang(lang: string) {
    if (this._service.lang === lang) {
      return;
    }

    this._service.fallbackLang = lang;
    this._addFallbackLangMiddleware(this.pipeline, lang);
  }

  public get fallbackLang(): string {
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
      pipeline
    );
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

@Injectable()
export class TranslateService implements TranslateServiceBase {
  private _id: string;
  private _languageChange$: typeof this._root.languageChange$;
  private _dictionaryChange$: typeof this._root.dictionaryChange$;

  get languageChange$() {
    if (!this._languageChange$) {
      this._languageChange$ = this._root.languageChange$.pipe();
    }
    return this._languageChange$;
  }

  get dictionaryChange$() {
    if (!this._dictionaryChange$) {
      this._dictionaryChange$ = this._root.dictionaryChange$.pipe();
    }
    return this._dictionaryChange$;
  }

  public get lang(): string {
    return this._root.lang;
  }

  public get fallbackLang(): string {
    return this._root.fallbackLang;
  }

  constructor(private _root: TranslateRootService, @Optional() @Inject(TRANSLATE_CHILD) _options?: TranslateChildConfig) {
    this._id = _options?.id;
    if (_options?.dictionaries) {
      Object.keys(_options.dictionaries).forEach((lang) => {
        this.extendDictionary(lang, _options.dictionaries[lang]);
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
