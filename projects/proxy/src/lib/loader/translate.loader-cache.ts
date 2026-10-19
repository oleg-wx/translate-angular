import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Dictionary } from 'simply-translate';

type CacheEntry = Dictionary | Observable<Dictionary>;

@Injectable({ providedIn: 'root' })
export class TranslateLoaderCache {
  /** id -> lang -> the loaded dictionary, or the load in flight */
  private readonly cache = new Map<string, Map<string, CacheEntry>>();

  get(lang: string, id: string): CacheEntry | undefined {
    return this.cache.get(id)?.get(lang);
  }

  set<T extends CacheEntry>(lang: string, id: string, value: T): T {
    let byLang = this.cache.get(id);
    if (!byLang) {
      byLang = new Map();
      this.cache.set(id, byLang);
    }
    byLang.set(lang, value);

    return value;
  }

  clear(lang: string, id: string): void {
    this.cache.get(id)?.delete(lang);
  }
}
