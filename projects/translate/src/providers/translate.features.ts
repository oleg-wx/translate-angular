import { InjectionToken, Provider } from '@angular/core';
import { Dictionaries, MiddlewareFunc, MiddlewareStatic } from 'simply-translate';
import { DefaultTranslateConfig, DEFAULT_CONFIG, LoadedDictionaries, ROOT_DICTIONARIES } from '../translate/translate.service';

/**
 * Loads dictionaries while the application initializes. Called inside an injection
 * context, so dependencies are taken with `inject()` instead of a `deps` array.
 */
export type TranslateLoaderFn = (opts: { lang: string | undefined; fallbackLang: string | undefined }) => LoadedDictionaries;

/** Returns middleware to append to the pipeline. Called inside an injection context. */
export type TranslateMiddlewareFn = () => Array<MiddlewareFunc | MiddlewareStatic> | void;

/** Runs once every loader has settled. Called inside an injection context. */
export type TranslateOnReadyFn = () => void;

export const TRANSLATE_LOADER_FNS = new InjectionToken<readonly TranslateLoaderFn[]>('TRANSLATE_LOADER_FNS');
export const TRANSLATE_MIDDLEWARE_FNS = new InjectionToken<readonly TranslateMiddlewareFn[]>('TRANSLATE_MIDDLEWARE_FNS');
export const TRANSLATE_ON_READY_FNS = new InjectionToken<readonly TranslateOnReadyFn[]>('TRANSLATE_ON_READY_FNS');

export enum TranslateFeatureKind {
  Config,
  Dictionaries,
  Loader,
  Middleware,
  OnReady,
}

export interface TranslateFeature<K extends TranslateFeatureKind = TranslateFeatureKind> {
  ɵkind: K;
  ɵproviders: Provider[];
}

function feature<K extends TranslateFeatureKind>(ɵkind: K, ɵproviders: Provider[]): TranslateFeature<K> {
  return { ɵkind, ɵproviders };
}

export function isTranslateFeature(value: unknown): value is TranslateFeature {
  return !!value && typeof value === 'object' && 'ɵkind' in (value as object) && 'ɵproviders' in (value as object);
}

/** Language, fallback language and placeholder behaviour. */
export function withConfig(config: DefaultTranslateConfig): TranslateFeature<TranslateFeatureKind.Config> {
  const value: DefaultTranslateConfig = {
    lang: config.lang,
    fallbackLang: config.fallbackLang,
    placeholder: config.placeholder !== undefined ? config.placeholder : 'default',
  };
  return feature(TranslateFeatureKind.Config, [{ provide: DEFAULT_CONFIG, useValue: value }]);
}

/** Dictionaries known up front, available before any loader runs. */
export function withDictionaries(dictionaries: Dictionaries): TranslateFeature<TranslateFeatureKind.Dictionaries> {
  return feature(TranslateFeatureKind.Dictionaries, [{ provide: ROOT_DICTIONARIES, useValue: dictionaries }]);
}

/**
 * Loads dictionaries during `APP_INITIALIZER`. Several loaders may be registered;
 * they run in parallel and the application waits for all of them.
 */
export function withLoader(load: TranslateLoaderFn): TranslateFeature<TranslateFeatureKind.Loader> {
  return feature(TranslateFeatureKind.Loader, [{ provide: TRANSLATE_LOADER_FNS, useValue: load, multi: true }]);
}

/** Appends middleware to the root pipeline before any loader runs. */
export function withMiddleware(addMiddleware: TranslateMiddlewareFn): TranslateFeature<TranslateFeatureKind.Middleware> {
  return feature(TranslateFeatureKind.Middleware, [{ provide: TRANSLATE_MIDDLEWARE_FNS, useValue: addMiddleware, multi: true }]);
}

/** Runs after every loader has settled, before the application starts. */
export function withOnReady(onReady: TranslateOnReadyFn): TranslateFeature<TranslateFeatureKind.OnReady> {
  return feature(TranslateFeatureKind.OnReady, [{ provide: TRANSLATE_ON_READY_FNS, useValue: onReady, multi: true }]);
}
