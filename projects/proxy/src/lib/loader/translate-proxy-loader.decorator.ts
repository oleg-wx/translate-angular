import { inject, Type } from '@angular/core';
import { TranslateProxy } from '../translate.proxy';
import { APPLY_LOADER, TranslateLoaderDictionaries } from './translate.loader';

export interface TranslateProxyLoaderConfig {
  id: string;
  dictionaries: TranslateLoaderDictionaries;
  preloadLangs?: string[];
  /** Also preload `TranslateService.fallbackLang`, if one is configured — resolved per instance, not at decoration time. */
  preloadFallbackLang?: boolean;
  /**
   * Other `TranslateProxy` classes this one depends on. Listed as class references (not string ids) so that
   * referencing them here forces a real import — and, more importantly, so this decorator can `inject()` each
   * one to force Angular to actually construct it. That's what makes the dependency reliable: the depended-on
   * proxy loads its own dictionary via its own `applyLoader()`, the moment *this* class is constructed, with no
   * requirement that anything else in the app separately inject it (as long as it's reachable from this
   * injector — e.g. `providedIn: 'root'`).
   */
  extends?: Type<TranslateProxy<any>>[];
}

/**
 * Declaratively configures a `TranslateProxy` subclass's loader, instead of implementing `applyLoader()` by hand.
 * Synthesizes `applyLoader()` on the class prototype — do not also implement `applyLoader()` yourself.
 */
export function TranslateProxyLoader(config: TranslateProxyLoaderConfig) {
  return function (target: Type<TranslateProxy<any>>): void {
    target.prototype[APPLY_LOADER] = function (this: TranslateProxy<any>) {
      // Runs inside the base class's constructor, which is itself running as part of this instance's DI
      // construction — so `inject()` here is called within a valid, active injection context.
      config.extends?.forEach((ext) => inject(ext));

      const preloadLangs = [...(config.preloadLangs ?? [])];
      if (config.preloadFallbackLang) {
        const fallbackLang = this.service.fallbackLang;
        if (fallbackLang && !preloadLangs.includes(fallbackLang)) {
          preloadLangs.push(fallbackLang);
        }
      }

      return { id: config.id, dictionaries: config.dictionaries, preloadLangs };
    };
  };
}
