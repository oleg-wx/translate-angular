import { APP_INITIALIZER, Inject, Injectable, InjectionToken, Injector, Optional } from '@angular/core';
import { Translations, Dictionary } from 'simply-translate';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { TranslateDynamicProps, TranslateKey } from 'simply-translate/dist/core/types';

export const DEFAULT_OPTIONS = new InjectionToken<{ cacheDynamic?: boolean }>('TranslateService DEFAULT_OPTIONS');

@Injectable()
export class TranslateService {
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

    constructor(@Optional() @Inject(DEFAULT_OPTIONS) options) {
        const cd = options ? options.cacheDynamic : false;
        this.service = new Translations({}, { cacheDynamic: options?.cacheDynamic !== false, $less: !!options?.$less });
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
}
