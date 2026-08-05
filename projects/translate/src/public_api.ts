export * from './translate/translate.directive';
export * from './translate/translate.pipe';
export * from './translate/translate.resolver';
export * from './translate/translate.service';
export * from './translate/proxy/translate.proxy';
export * from './translate/proxy/schema';
export { TranslateLoaderSupport, TranslateLoaderDictionaries, TranslateLoaderDictionary } from './translate/proxy/loader/translate.loader';
export { TranslateLoaderCache } from './translate/proxy/loader/translate.loader-cache';
export { translateLoaderResolver } from './translate/proxy/loader/translate.loader.resolver';
export { TranslateProxyLoader, TranslateProxyLoaderConfig } from './translate/proxy/loader/translate-proxy-loader.decorator';
export * from './simply-translate.module';
export { TranslateChildConfig } from './translate/translate.service';
export {
  Dictionary,
  Dictionaries,
  DictionaryEntry,
  TranslateKey,
  TranslateDynamicProps,
  Pipeline,
  SimplePipeline,
  SimpleDefaultPipeline,
} from 'simply-translate';
