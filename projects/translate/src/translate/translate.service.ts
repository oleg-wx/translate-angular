import { Inject, Injectable, InjectionToken, Injector, Optional, SkipSelf } from '@angular/core';
import { Translations, Dictionary } from 'simply-translate';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { TranslateDynamicProps, TranslateKey } from 'simply-translate';
import { S_TRANSLATE, TranslateSettings } from './translate-child-config';

export interface DefaultTranslateOptions {
  cacheDynamic?: boolean;
  $less?: boolean;
  onFailure?: (lang: string, key: TranslateKey) => void;
}

export const DEFAULT_OPTIONS = new InjectionToken<DefaultTranslateOptions>('TranslateService DEFAULT_OPTIONS');

export abstract class TranslateServiceBase {
  abstract get defaultLang(): string;
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
  private langChangeSubj = new BehaviorSubject<{ defaultLang?: string; fallbackLang?: string }>({});
  private dictionarySubj = new Subject<void>();
  private service: Translations;

  public languageChange$ = this.langChangeSubj.asObservable();
  public dictionaryChange$ = this.dictionarySubj.asObservable();

  public set defaultLang(val: string) {
    this.service.defaultLang = val;
    this.langChangeSubj.next({ defaultLang: this.defaultLang, fallbackLang: this.fallbackLang });
  }

  public get defaultLang(): string {
    return this.service.defaultLang;
  }

  public set fallbackLang(val: string) {
    this.service.fallbackLang = val;
    this.langChangeSubj.next({ defaultLang: this.defaultLang, fallbackLang: this.fallbackLang });
  }

  public get fallbackLang(): string {
    return this.service.fallbackLang;
  }

  public set onFailure(val: (lang: string, key: string) => void) {
    this.service.onFailure = val;
    this.langChangeSubj.next({ defaultLang: this.defaultLang, fallbackLang: this.fallbackLang });
  }

  public get onFailure() {
    return this.service.onFailure;
  }

  constructor(@Optional() @Inject(DEFAULT_OPTIONS) options: DefaultTranslateOptions) {
    const cd = options ? options.cacheDynamic : false;
    this.service = new Translations({}, { cacheDynamic: cd, $less: !!options?.$less, onFailure: options.onFailure });
  }

  translateTo(lang: string, key: TranslateKey): string;
  translateTo(lang: string, key: TranslateKey, fallback: string): string;
  translateTo(lang: string, key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: string): string;
  translateTo(lang: string, key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: string): string {
    return this.service.translateTo(lang, key, dynamicValuesOrFallback as any, fallback);
  }

  translate(key: TranslateKey): string;
  translate(key: TranslateKey, fallback: string): string;
  translate(key: TranslateKey, dynamicValues: TranslateDynamicProps, fallback?: string): string;
  translate(key: TranslateKey, dynamicValuesOrFallback?: TranslateDynamicProps | string, fallback?: string): string {
    return this.service.translate(key, dynamicValuesOrFallback as any, fallback);
  }

  extendDictionary(lang: string, dictionary: Dictionary) {
    this.service.extendDictionary(lang, dictionary);
    this.dictionarySubj.next();
  }

  hasTranslation(key: TranslateKey) {
    return this.service.hasTranslation(key);
  }
}

@Injectable()
export class TranslateService implements TranslateServiceBase {
  public get defaultLang(): string {
    return this._root.defaultLang;
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
    console.log(key);
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
    if (this._root['service'].dictionaries[this.defaultLang][this._options?.id] !== undefined) {
      if (this._root.hasTranslation(_key)) {
        return _key;
      } else {
        return key;
      }
    }

    return key;
  }
}
