import { inject, Injectable, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Dictionary, DictionaryEntry, TranslateDynamicProps } from 'simply-translate';
import type { BaseNode, NamespaceNode, SchemaShape, TranslateSchemaNode } from './schema/schema.types';
import { TranslateService } from './translate.service';

type TranslationFunction<TParams = undefined> = (TParams extends undefined
  ? {
      (): string;
      Signal: () => Signal<string>;
      $: () => Observable<string>;
    }
  : {
      (dynamicProps: TParams): string;
      Signal: (dynamicProps: TParams | Signal<TParams>) => Signal<string>;
      $: (dynamicProps: TParams | Observable<TParams>) => Observable<string>;
    }) &
  string;

export type ProxyDictionary<Shape extends SchemaShape> = {
  [K in keyof Shape]: Shape[K] extends NamespaceNode<infer ChildShape>
    ? ProxyDictionary<ChildShape>
    : Shape[K] extends BaseNode<infer TParams>
      ? TranslationFunction<TParams>
      : never;
};

export type DictionaryValue<T = string> = T extends string ? string : T extends Dictionary ? T : DictionaryEntry;

@Injectable()
export abstract class TranslateProxy<S extends TranslateSchemaNode> {
  private _cache: any = {};

  readonly service = inject(TranslateService);
  readonly object: ProxyDictionary<S['shape']> = this.createLazyProxy([], this._cache);

  private createLazyProxy(fullPath: string[], cache: any): any {
    if (cache.$$proxy) {
      return cache.$$proxy;
    }

    const targetNode = (dynamicProps?: TranslateDynamicProps) => {
      return this.service.translate(fullPath, dynamicProps!);
    };

    targetNode.toString = () => fullPath.join('.');
    targetNode.valueOf = () => fullPath;

    cache.$$proxy = new Proxy(targetNode, {
      get: (target, prop) => {
        if (prop === '$') {
          return ((target as any).$ ??= this.createObservableAccessor(fullPath));
        }
        if (prop === 'Signal') {
          return ((target as any).Signal ??= this.createSignalAccessor(fullPath));
        }
        if (typeof prop === 'symbol' || prop === 'then' || prop === 'toString' || prop === 'valueOf') {
          return (target as any)[prop];
        }

        const propStr = String(prop);
        const nextPath = [...fullPath, propStr];
        return this.createLazyProxy(nextPath, (cache[propStr] ??= {}));
      },
    });

    return cache.$$proxy;
  }

  private createObservableAccessor(fullPath: string[]) {
    let noArgsCache: Observable<string> | undefined;
    const cache = new WeakMap<object, Observable<string>>();

    return (dynamicProps?: TranslateDynamicProps | Observable<TranslateDynamicProps>) => {
      if (dynamicProps === undefined) {
        return (noArgsCache ??= this.service.translateObservable(fullPath));
      }
      let cached = cache.get(dynamicProps);
      if (!cached) {
        cached = this.service.translateObservable(fullPath, dynamicProps as any);
        cache.set(dynamicProps, cached);
      }
      return cached;
    };
  }

  private createSignalAccessor(fullPath: string[]) {
    let noArgsCache: Signal<string> | undefined;
    const cache = new WeakMap<object, Signal<string>>();

    return (dynamicProps?: TranslateDynamicProps | Signal<TranslateDynamicProps>) => {
      if (dynamicProps === undefined) {
        return (noArgsCache ??= this.service.translateSignal(fullPath));
      }
      let cached = cache.get(dynamicProps);
      if (!cached) {
        cached = this.service.translateSignal(fullPath, dynamicProps as any);
        cache.set(dynamicProps, cached);
      }
      return cached;
    };
  }
}
