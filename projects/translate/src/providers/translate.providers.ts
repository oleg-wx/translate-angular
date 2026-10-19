import {
  EnvironmentProviders,
  inject,
  InjectionToken,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
  provideEnvironmentInitializer,
  Provider,
} from '@angular/core';
import { Dictionaries } from 'simply-translate';
import { TranslateDirective } from '../translate/translate.directive';
import { TranslatePipe, TranslatePipeDetect, TranslateToPipe } from '../translate/translate.pipe';
import { translateChildResolver, TranslateResolve } from '../translate/translate.resolver';
import {
  DefaultTranslateConfig,
  DEFAULT_CONFIG,
  ROOT_DICTIONARIES,
  TranslateChildConfig,
  TranslateRootService,
  TranslateService,
  TRANSLATE_CHILD,
} from '../translate/translate.service';
import { asDictionaries$ } from '../translate/translate.utils';
import { isTranslateFeature, TranslateFeature, TranslateFeatureKind, TranslateLoaderFn, withConfig } from './translate.features';
import { translateInitializerFactory } from './translate.initializer';

/** Everything a template needs: the three pipes and the `translate` directive. */
export const TRANSLATE_IMPORTS = [TranslatePipe, TranslateToPipe, TranslatePipeDetect, TranslateDirective] as const;

const TRANSLATE_ROOT_GUARD = new InjectionToken<true>('TRANSLATE_ROOT_GUARD');

/** Features that may only be used once, mapped to the name to report when they are not. */
const SINGLE_USE_FEATURES: Partial<Record<TranslateFeatureKind, string>> = {
  [TranslateFeatureKind.Config]: 'withConfig',
  [TranslateFeatureKind.Dictionaries]: 'withDictionaries',
};

function assertFeaturesUsedOnce(features: readonly TranslateFeature[]) {
  const seen = new Set<TranslateFeatureKind>();
  features.forEach(({ ɵkind }) => {
    const name = SINGLE_USE_FEATURES[ɵkind];
    if (name && seen.has(ɵkind)) {
      throw new Error(`provideTranslate(): ${name}() can only be used once.`);
    }
    seen.add(ɵkind);
  });
}

function rootGuard() {
  if (inject(TRANSLATE_ROOT_GUARD, { optional: true, skipSelf: true })) {
    throw new Error('provideTranslate() was called more than once. Lazily loaded routes should use provideTranslateChild() instead.');
  }
}

function childGuard() {
  if (!inject(TRANSLATE_ROOT_GUARD, { optional: true })) {
    throw new Error('provideTranslateChild() requires provideTranslate() in the application providers.');
  }
}

/**
 * Sets up translation for the whole application.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideTranslate(
 *       { lang: 'en', fallbackLang: 'en' },
 *       withLoader(({ lang }) => inject(HttpClient).get<Dictionaries>(`/i18n/${lang}.json`)),
 *     ),
 *   ],
 * });
 * ```
 */
export function provideTranslate(config?: DefaultTranslateConfig, ...features: TranslateFeature[]): EnvironmentProviders;
export function provideTranslate(...features: TranslateFeature[]): EnvironmentProviders;
export function provideTranslate(
  configOrFeature?: DefaultTranslateConfig | TranslateFeature,
  ...rest: TranslateFeature[]
): EnvironmentProviders {
  const features = isTranslateFeature(configOrFeature)
    ? [configOrFeature, ...rest]
    : [withConfig((configOrFeature as DefaultTranslateConfig) ?? {}), ...rest];

  if (isDevMode()) {
    assertFeaturesUsedOnce(features);
  }

  return makeEnvironmentProviders([
    TranslateRootService,
    TranslateService,
    TranslateResolve,
    { provide: TRANSLATE_CHILD, useValue: {} },
    { provide: DEFAULT_CONFIG, useValue: { placeholder: 'default' } as DefaultTranslateConfig },
    { provide: ROOT_DICTIONARIES, useValue: {} as Dictionaries },
    { provide: TRANSLATE_ROOT_GUARD, useValue: true },
    ...(isDevMode() ? [provideEnvironmentInitializer(rootGuard)] : []),
    provideAppInitializer(() => translateInitializerFactory()()),
    // features last, so that withConfig()/withDictionaries() override the defaults above
    features.map((feature) => feature.ɵproviders),
  ]);
}

export interface TranslateChildOptions {
  /** Key prefix for this scope. Keys fall back to the root dictionary when it has no entry under the prefix. */
  id?: string;
  /** Dictionaries merged into the root service as soon as the scope is created. */
  dictionaries?: Dictionaries;
  /**
   * Loads dictionaries for this scope. Runs inside an injection context, so dependencies
   * are taken with `inject()`. Needs `translateChildResolver` on the route to be awaited.
   */
  loadDictionaries?: TranslateLoaderFn;
}

/**
 * Scopes translation to a route and the components below it. Goes in `Route.providers`;
 * pair it with `translateChildResolver` (or use `withTranslateChild()`) when it loads
 * dictionaries asynchronously.
 */
export function provideTranslateChild(options: TranslateChildOptions = {}): EnvironmentProviders {
  const load = options.loadDictionaries;
  const value: TranslateChildConfig = {
    id: options.id,
    dictionaries: options.dictionaries,
    loadDictionaries: load && ((opts) => asDictionaries$(load(opts))),
  };

  return makeEnvironmentProviders([
    TranslateService,
    TranslateResolve,
    { provide: TRANSLATE_CHILD, useValue: value },
    ...(isDevMode() ? [provideEnvironmentInitializer(childGuard)] : []),
  ]);
}

/**
 * `provideTranslateChild()` plus the resolver that awaits its dictionaries, ready to
 * spread into a route:
 *
 * ```ts
 * { path: 'orders', ...withTranslateChild({ id: 'orders', loadDictionaries: () => ... }), loadComponent: ... }
 * ```
 */
export function withTranslateChild(options: TranslateChildOptions = {}): {
  providers: Array<Provider | EnvironmentProviders>;
  resolve: { translate: typeof translateChildResolver };
} {
  return {
    providers: [provideTranslateChild(options)],
    resolve: { translate: translateChildResolver },
  };
}
