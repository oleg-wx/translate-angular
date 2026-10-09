/*
 * Public API Surface of simply-translate-angular-proxy
 */

export * from './lib/translate.proxy';
export * from './lib/schema';
export { TranslateLoaderSupport, TranslateLoaderDictionaries, TranslateLoaderDictionary } from './lib/loader/translate.loader';
export { TranslateLoaderCache } from './lib/loader/translate.loader-cache';
export { translateLoaderResolver } from './lib/loader/translate.loader.resolver';
export { TranslateProxyLoader, TranslateProxyLoaderConfig } from './lib/loader/translate-proxy-loader.decorator';
