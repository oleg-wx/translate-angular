import { inject, Injectable, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Dictionary, TranslateDynamicProps } from 'simply-translate';
import { TranslateService } from './translate.service';

type TranslationFunction = {
  (dynamicProps?: TranslateDynamicProps): string;
  Signal: (dynamicProps?: TranslateDynamicProps | Signal<TranslateDynamicProps>) => Signal<string>;
  $: (dynamicProps?: TranslateDynamicProps | Observable<TranslateDynamicProps>) => Observable<string>;
} & string;

export type ProxyDictionary<T extends Dictionary> = {
  [K in keyof T]: T[K] extends Dictionary ? ProxyDictionary<T[K]> : TranslationFunction;
};

@Injectable()
export abstract class TranslateProxy<T extends Dictionary> extends TranslateService {
  private _service = inject(TranslateService);
  private _cache: Map<string, { $?: Observable<string>; Signal?: Signal<string> }> = new Map();

  readonly object: ProxyDictionary<T> = this.createLazyProxy<T>([]);

  private getOrCreateCache(key: string): { $?: Observable<string>; Signal?: Signal<string> } {
    let cache = this._cache.get(key);
    return cache ?? ((cache = {}), this._cache.set(key, cache), cache);
  }

  private createLazyProxy<T>(currentPath: string[]): any {
    const targetNode = (dynamicProps?: TranslateDynamicProps) => {
      const lastKey = currentPath[currentPath.length - 1];
      if (lastKey === '$' || lastKey === 'Signal') {
        const key = currentPath.slice(0, -1);
        const keyString = key.join('.');
        const cache = this.getOrCreateCache(keyString);

        if (lastKey === '$') {
          if (!cache.$) {
            cache.$ = this._service.translateObservable(key, dynamicProps!);
          }
          return cache.$;
        }
        if (lastKey === 'Signal') {
          if (!cache.Signal) {
            cache.Signal = this._service.translateSignal(key, dynamicProps!);
          }
          return cache.Signal;
        }
      }

      return this._service.translate(currentPath, dynamicProps!);
    };

    targetNode.toString = () => currentPath.join('.');

    return new Proxy(targetNode, {
      get: (target, prop) => {
        if (typeof prop === 'symbol' || prop === 'then' || prop === 'toString' || prop === 'valueOf') {
          return (target as any)[prop];
        }

        const nextPath = [...currentPath, String(prop)];
        return this.createLazyProxy(nextPath);
      },
    });
  }
}
