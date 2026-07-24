import { ChangeDetectorRef, inject, Pipe, PipeTransform } from '@angular/core';
import { DictionaryEntry, TranslateDynamicProps, TranslateKey } from 'simply-translate';
import { TranslateService } from './translate.service';
import { merge } from 'rxjs';

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
  private _lang: string | undefined;
  private _key!: TranslateKey;
  private _dynOrFb: string | TranslateDynamicProps | undefined;
  private _fb: DictionaryEntry | string | undefined;
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    const service = inject(TranslateService);
    super(service);

    merge(service.languageChange$, service.dictionaryChange$)
// take until
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  transform(key: TranslateKey, dynamicOrFallback?: TranslateDynamicProps | string, fallback?: DictionaryEntry | string): string {
    if (this._lang === this.service.lang && this._key === key && this._dynOrFb === dynamicOrFallback && this._fb === fallback) {
      return this._latestValue;
    }

    this._lang = this.service.lang;
    this._key = key;
    this._dynOrFb = dynamicOrFallback;
    this._fb = fallback;
    this._latestValue = super.transform(key, dynamicOrFallback, fallback);

    return this._latestValue;
  }
}
