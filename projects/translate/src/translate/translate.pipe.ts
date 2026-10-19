import { inject, Pipe, PipeTransform } from '@angular/core';
import { DictionaryEntry, TranslateDynamicProps, TranslateKey } from 'simply-translate';
import { TranslateService } from './translate.service';

@Pipe({ name: 'translate' })
export class TranslatePipe implements PipeTransform {
  constructor(protected service: TranslateService) {}

  transform(key: TranslateKey, dynamicOrFallback?: TranslateDynamicProps | string, fallback?: DictionaryEntry | string): string {
    if (key == null || key === '') {
      return '';
    }
    const result = this.service.translate(key, dynamicOrFallback as any, fallback);
    return result;
  }
}

@Pipe({ name: 'translateTo' })
export class TranslateToPipe implements PipeTransform {
  constructor(protected service: TranslateService) {}

  transform(key: TranslateKey, lang: string, dynamicOrFallback?: TranslateDynamicProps | string, fallback?: DictionaryEntry | string): string {
    if (key == null || key === '') {
      return '';
    }
    const result = this.service.translateTo(lang, key, dynamicOrFallback as any, fallback);
    return result;
  }
}

@Pipe({ name: 'translate$', pure: false })
export class TranslatePipeDetect extends TranslatePipe {
  private _latestValue: string = '';
  private _key!: TranslateKey;
  private _lastVersion = -1;
  private _dynOrFb: string = '';
  private _fb: DictionaryEntry | string | undefined;

  constructor() {
    const service = inject(TranslateService);
    super(service);
  }

  transform(key: TranslateKey, dynamicOrFallback?: TranslateDynamicProps | string, fallback?: DictionaryEntry | string): string {
    const version = this.service.stateVersion();

    const dynOrFb = typeof dynamicOrFallback === 'object' ? JSON.stringify(dynamicOrFallback) : dynamicOrFallback || '';

    if (this._lastVersion === version && this._key === key && this._dynOrFb === dynOrFb && this._fb === fallback) {
      return this._latestValue;
    }

    this._key = key;
    this._dynOrFb = dynOrFb;
    this._fb = fallback;
    this._lastVersion = version;

    this._latestValue = super.transform(key, dynamicOrFallback, fallback);

    return this._latestValue;
  }
}
