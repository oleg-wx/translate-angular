import { APP_INITIALIZER, Inject, Injectable, InjectionToken, Injector, Optional } from '@angular/core';
import { Translations, Dictionary } from 'simply-translate';

export const DEFAULT_OPTIONS = new InjectionToken<{ cacheDynamic?: boolean }>('TranslateService DEFAULT_OPTIONS');

@Injectable()
export class TranslateService {
    private service: Translations;

    public defaultLang:string;

    constructor(@Optional() @Inject(DEFAULT_OPTIONS) options) {
        const cd = options ? options.cacheDynamic : false;
        this.service = new Translations({}, { cacheDynamic: cd });
    }

    translateTo(lang: string, key: string, dynamicValues?: { [key: string]: string | number }, fallback?: string): string {
        return this.service.translate(lang, key, dynamicValues, fallback);
    }

    translate(key: string, dynamicValues?: { [key: string]: string | number }, fallback?: string): string {
        return this.service.translate(this.defaultLang, key, dynamicValues, fallback);
    }

    extendDictionary(lang: string, dictionary: Dictionary) {
        this.service.extendDictionary(lang,dictionary);
    }
}
