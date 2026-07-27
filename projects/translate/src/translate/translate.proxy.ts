import { inject, Injectable, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Dictionary, DictionaryEntry, TranslateDynamicProps } from 'simply-translate';
import { TranslateService } from './translate.service';

type TranslationFunction = {
  (dynamicProps?: TranslateDynamicProps): string;
  Signal: (dynamicProps?: TranslateDynamicProps | Signal<TranslateDynamicProps>) => Signal<string>;
  $: (dynamicProps?: TranslateDynamicProps | Observable<TranslateDynamicProps>) => Observable<string>;
} & string;

export type ProxyDictionary<T extends Dictionary> = {
  [K in keyof T]: T[K] extends Dictionary ? ProxyDictionary<T[K]> : TranslationFunction;
};

export type DictionaryValue<T = string> = T extends string ? string : T extends Dictionary ? T : DictionaryEntry;

@Injectable()
export abstract class TranslateProxy<T extends Dictionary> extends TranslateService {
  private _service = inject(TranslateService);
  private _cache: any = {};

  readonly object: ProxyDictionary<T> = this.createLazyProxy<T>([], this._cache);

  private createLazyProxy<T>(fullPath: string[], cache: any): any {
    if (cache.$$proxy) {
      return cache.$$proxy;
    }

    let observableCache: Observable<string> | undefined;
    let signalCache: Signal<string> | undefined;

    const targetNode = (dynamicProps?: TranslateDynamicProps) => {
      return this._service.translate(fullPath, dynamicProps!);
    };

    targetNode.toString = () => fullPath.join('.');
    targetNode.valueOf = () => fullPath;

    targetNode.$ = (dynamicProps?: TranslateDynamicProps | Observable<TranslateDynamicProps>) => {
      return (observableCache ??= this._service.translateObservable(fullPath, dynamicProps as any));
    };

    targetNode.Signal = (dynamicProps?: TranslateDynamicProps | Signal<TranslateDynamicProps>) => {
      return (signalCache ??= this._service.translateSignal(fullPath, dynamicProps as any));
    };

    cache.$$proxy = new Proxy(targetNode, {
      get: (target, prop) => {
        if (typeof prop === 'symbol' || prop === 'then' || prop === 'toString' || prop === 'valueOf' || prop === '$' || prop === 'Signal') {
          return (target as any)[prop];
        }

        const propStr = String(prop);
        const nextPath = [...fullPath, propStr];
        return this.createLazyProxy(nextPath, (cache[propStr] ??= {}));
      },
    });

    return cache.$$proxy;
  }
}
