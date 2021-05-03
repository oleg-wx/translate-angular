import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from './translate.service';

@Pipe({ name: 'translate' })
export class TranslatePipe implements PipeTransform {
    constructor(private service: TranslateService) {}
    transform(value: string, dynamic?: { [key: string]: string }, fallback?: string) {
        if (value == null || value === '') {
            return value;
        }
        const result = this.service.translate(value, dynamic, fallback);
        return result;
    }
}

@Pipe({ name: 'translateTo' })
export class TranslateToPipe implements PipeTransform {
    constructor(private service: TranslateService) {}
    transform(value: string, lang: string, dynamic?: { [key: string]: string }, fallback?: string) {
        if (value == null || value === '') {
            return value;
        }
        const result = this.service.translateTo(lang, value, dynamic, fallback);
        return result;
    }
}
