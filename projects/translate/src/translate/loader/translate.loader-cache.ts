import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Dictionary } from 'simply-translate';

@Injectable()
export class TranslateLoaderCache {
  private readonly cache: Partial<Record<string, Dictionary | Observable<Dictionary>>> = {};

  get(lang: string, id: string): Dictionary | Observable<Dictionary> | undefined {
    return this.cache[`${id}_${lang}`];
  }

  set<T extends Dictionary | Observable<Dictionary>>(lang: string, id: string, value: T): T {
    this.cache[`${id}_${lang}`] = value;

    return value;
  }

  clear(lang: string, id: string): void {
    delete this.cache[`${id}_${lang}`];
  }
}


