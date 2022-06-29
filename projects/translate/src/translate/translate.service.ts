import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  Translations,
  Dictionary,
  SimplePipeline,
  MiddlewareFunc,
  MiddlewareStatic,
  PlaceholderType,
  TranslateDynamicProps,
  TranslateKey,
} from 'simply-translate';
import { GetEntryMiddleware } from 'simply-translate/dist/core/middleware/get-entry-middleware';
import { FallbackWithDifferentLanguageMiddleware } from 'simply-translate/dist/core/middleware/fallback-with-different-language-middleware';
import { S_TRANSLATE, TranslateSettings } from './translate-child-config';

export interface DefaultTranslateOptions {
  lang?: string;
  fallbackLang?: string;
  placeholder?: PlaceholderType;
}

export const DEFAULT_OPTIONS = new InjectionToken<DefaultTranslateOptions>('TranslateService DEFAULT_OPTIONS');

export abstract class TranslateServiceBase {
  abstract get lang(): string;
  abstract get fallbackLang(): string;

  abstract translateTo(lang: string, key: TranslateKey): string;
  abstract translateTo(lang: string, key: TranslateKey, fallback: string): string;
  abstract translateTo(lang: string, key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: string): string;
  abstract translateTo(lang: string, key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: string): string;

  abstract translate(key: TranslateKey): string;
  abstract translate(key: TranslateKey, fallback: string): string;
  abstract translate(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: string): string;
  abstract translate(key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: string);

  abstract extendDictionary(lang: string, dictionary: Dictionary);
}

@Injectable()
export class TranslateRootService implements TranslateServiceBase {
  private _fallbackAdded = false;
  private _langChangeSubj = new BehaviorSubject<{ lang?: string; fallbackLang?: string }>({});
  private _dictionarySubj = new Subject<void>();
  private _service: Translations;

  public languageChange$ = this._langChangeSubj.asObservable();
  public dictionaryChange$ = this._dictionarySubj.asObservable();

  public get pipeline() {
    return this._service.pipeline as SimplePipeline;
  }

  public set lang(val: string) {
    this._service.lang = val;
    this._langChangeSubj.next({ lang: this.lang, fallbackLang: this.fallbackLang });
  }

  public get lang(): string {
    return this._service.lang;
  }

  public set fallbackLang(val: string) {
    this._service.fallbackLang = val;
    this._addFallbackMiddleware(this.pipeline, val);
    this._langChangeSubj.next({ lang: this.lang, fallbackLang: this.fallbackLang });
  }

  public get fallbackLang(): string {
    return this._service.fallbackLang;
  }

  constructor(@Optional() @Inject(DEFAULT_OPTIONS) options: DefaultTranslateOptions) {
    const pipeline = new SimplePipeline();

    this._addFallbackMiddleware(pipeline, options.fallbackLang);

    this._service = new Translations({}, { placeholder: options?.placeholder, lang: options?.lang, fallbackLang: options?.fallbackLang }, pipeline);
  }

  translateTo(lang: string, key: TranslateKey): string;
  translateTo(lang: string, key: TranslateKey, fallback: string): string;
  translateTo(lang: string, key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: string): string;
  translateTo(lang: string, key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: string): string {
    return this._service.translateTo(lang, key, dynamicValuesOrFallback as any, fallback);
  }

  translate(key: TranslateKey): string;
  translate(key: TranslateKey, fallback: string): string;
  translate(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: string): string;
  translate(key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: string): string {
    return this._service.translate(key, dynamicValuesOrFallback as any, fallback);
  }

  extendDictionary(lang: string, dictionary: Dictionary) {
    this._service.extendDictionary(lang, dictionary);
    this._dictionarySubj.next();
  }

  hasTranslation(key: TranslateKey) {
    return this._service.hasTranslation(key);
  }

  private _addFallbackMiddleware(pipeline: SimplePipeline, fallbackLang: string | undefined) {
    if (fallbackLang && !this._fallbackAdded) {
      this._fallbackAdded = true;
      pipeline.addMiddlewareAt(2, new FallbackWithDifferentLanguageMiddleware(GetEntryMiddleware));
    }
  }
}

@Injectable()
export class TranslateService implements TranslateServiceBase {
  private _languageChange$: typeof this._root.languageChange$;
  private _dictionaryChange$: typeof this._root.dictionaryChange$;

  get languageChange$() {
    if(!this._languageChange$){
      this._languageChange$ = this._root.languageChange$.pipe();
    }
    return this._languageChange$;
  }

  get dictionaryChange$() {
    if(!this._dictionaryChange$){
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

  constructor(@Optional() private _root: TranslateRootService, @Optional() @Inject(S_TRANSLATE) private _options: TranslateSettings) {}

  translateTo(lang: string, key: TranslateKey): string;
  translateTo(lang: string, key: TranslateKey, fallback: string): string;
  translateTo(lang: string, key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: string): string;
  translateTo(lang: string, key: TranslateKey, dynamicValuesOrFallback?: string | TranslateDynamicProps, fallback?: string): string {
    return this._root.translateTo(lang, this.getChildKey(key), dynamicValuesOrFallback as any, fallback);
  }

  translate(key: TranslateKey): string;
  translate(key: TranslateKey, fallback: string): string;
  translate(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: string): string;
  translate(key: TranslateKey, dynamicValuesOrFallback?: string | TranslateDynamicProps, fallback?: string): string {
    return this._root.translate(this.getChildKey(key), dynamicValuesOrFallback as any, fallback);
  }

  extendDictionary(lang: string, dictionary: Dictionary) {
    if (!this._options?.id) {
      this._root.extendDictionary(lang, dictionary);
    }
    this._root.extendDictionary(lang, { [this._options?.id]: dictionary });
  }

  private getChildKey(key: TranslateKey) {
    if (!this._options?.id) return key;

    let _key: any;

    if (typeof key === 'string') {
      _key = `${this._options?.id}.${key}`;
    } else {
      _key = [this._options.id, ...key];
    }

    if (this._root['_service'].dictionaries[this.lang][this._options?.id] !== undefined) {
      if (this._root.hasTranslation(_key)) {
        return _key;
      } else {
        return key;
      }
    }

    return key;
  }
}
