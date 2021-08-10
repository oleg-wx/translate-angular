import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from './translate.service';

@Pipe({ name: 'translate' })
export class TranslatePipe implements PipeTransform {
    constructor(private service: TranslateService) {}
    transform(key: string|string[], dynamic?: { [key: string]: string|number }, fallback?: string) {
        if (key == null || key === '') {
            return key;
        }
        const result = this.service.translate(key, dynamic, fallback);
        return result;
    }
}

@Pipe({ name: 'translateTo' })
export class TranslateToPipe implements PipeTransform {
    constructor(private service: TranslateService) {}
    transform(key: string|string[], lang: string, dynamic?: { [key: string]: string|number }, fallback?: string) {
        if (key == null || key === '') {
            return key;
        }
        const result = this.service.translateTo(lang, key, dynamic, fallback);
        return result;
    }
}
