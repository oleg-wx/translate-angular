import { APP_INITIALIZER, Inject, Injectable, InjectionToken, Injector, Optional } from '@angular/core';
import { Translations, Dictionary } from 'simply-translate';

export const DEFAULT_OPTIONS = new InjectionToken<{ cacheDynamic?: boolean }>('TranslateService DEFAULT_OPTIONS');

@Injectable()
export class TranslateService {
    private service: Translations;

    public set defaultLang(val: string) {
        this.service.defaultLang = val;
    }
    public get defaultLang(): string {
        return this.service.defaultLang;
    }

    public set fallbackLang(val: string) {
        this.service.fallbackLang = val;
    }
    public get fallbackLang(): string {
        return this.service.fallbackLang;
    }

    constructor(@Optional() @Inject(DEFAULT_OPTIONS) options) {
        const cd = options ? options.cacheDynamic : false;
        this.service = new Translations({}, { cacheDynamic: cd });
    }

    translateTo(lang: string, key: string, dynamicValues?: { [key: string]: string | number }, fallback?: string): string {
        return this.service.translateTo(lang, key, dynamicValues, fallback);
    }

    translate(key: string, dynamicValues?: { [key: string]: string | number }, fallback?: string): string {
        return this.service.translate(key, dynamicValues, fallback);
    }

    extendDictionary(lang: string, dictionary: Dictionary) {
        this.service.extendDictionary(lang, dictionary);
    }
}
