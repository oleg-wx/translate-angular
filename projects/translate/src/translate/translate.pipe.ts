import { Pipe, PipeTransform } from '@angular/core';
import { TranslateDynamicProps, TranslateKey } from 'simply-translate';
import { TranslateService } from './translate.service';

@Pipe({ name: 'translate' })
export class TranslatePipe implements PipeTransform {
  constructor(private service: TranslateService) {}
  transform(key: TranslateKey, dynamicOrFallback?: TranslateDynamicProps | string, fallback?: string): string {
    if (key == null || key === '') {
      return '';
    }
    const result = this.service.translate(key, dynamicOrFallback as any, fallback);
    return result;
  }
}

@Pipe({ name: 'translateTo' })
export class TranslateToPipe implements PipeTransform {
  constructor(private service: TranslateService) {}
  transform(key: TranslateKey, lang: string, dynamicOrFallback?: TranslateDynamicProps | string, fallback?: string): string {
    if (key == null || key === '') {
      return '';
    }
    const result = this.service.translateTo(lang, key, dynamicOrFallback as any, fallback);
    return result;
  }
}
