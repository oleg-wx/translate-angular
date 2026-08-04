import { inject, Injectable, OnDestroy, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Dictionary, DictionaryEntry, TranslateDynamicProps } from 'simply-translate';
import type { BaseNode, NamespaceNode, SchemaShape, TranslateSchemaNode } from './schema/schema.types';
import { TranslateService } from '../translate.service';
import { TranslateLoader, TranslateLoaderDictionaries, TranslateLoaderSupport } from './loader/translate.loader';
import { TranslateLoaderCache } from './loader/translate.loader-cache';
import { HttpClient } from '@angular/common/http';

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

@Injectable()
export abstract class TranslateProxy<S extends TranslateSchemaNode> implements OnDestroy, Partial<TranslateLoaderSupport> {
  private _cache: any = {};

  readonly service = inject(TranslateService);
  readonly object: ProxyDictionary<S['shape']> = this.createLazyProxy([], this._cache);
  private _id?: string;
  private _dictionaries?: Record<string, Dictionary | Promise<Dictionary> | Observable<Dictionary> | string>;
  private _loader?: TranslateLoader;

  constructor() {
    const loaderInfo = this.applyLoader?.();
    if (loaderInfo) {
      this._load(loaderInfo.id, loaderInfo.dictionaries, loaderInfo.preloadLangs);
    }
  }

  applyLoader?(): { id: string; dictionaries: TranslateLoaderDictionaries; preloadLangs?: string[] };
  onLoaderReady?(args: { lang: string; id: string }): void;
  onLoaderError?(args: { lang: string; id: string; error: any }): void;

  /**
   * Loads this proxy's dictionary for `lang` right away, without waiting for the app to switch to it.
   * Nothing is preloaded automatically — declare known languages upfront via `applyLoader()`'s
   * `preloadLangs`, and call this for anything ad hoc. A no-op if this proxy has no loader.
   */
  preloadLang(lang: string | undefined): void {
    this._loader?.preloadLang(lang);
  }

  private _load(id: string, dictionaries: TranslateLoaderDictionaries, preloadLangs?: string[]) {
    this._id = id;
    this._dictionaries = dictionaries ?? {};
    if (this._id) {
      this._loader = new TranslateLoader(
        inject(TranslateLoaderCache),
        inject(HttpClient),
        this.service,
        this._id,
        this._dictionaries,
        preloadLangs ?? [],
      );
      this._loader.init();
      this._loader.ready$.subscribe((info) => {
        this.onLoaderReady?.(info);
      });
      this._loader.errors$.subscribe((error) => {
        this.onLoaderError?.(error);
      });
    }
  }

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

  ngOnDestroy(): void {
    this._loader?.remove();
  }
}
