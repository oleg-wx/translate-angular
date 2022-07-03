import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injectable, InjectionToken } from '@angular/core';
import { debounceTime, map, of, tap } from 'rxjs';
import { InjectedTestClass, InjectedValue, TestInjectedServiceComponent } from './core/test.component';
import { TranslateModule, factory, DefaultTranslateConfig, TranslateRootService, TranslateService } from '../public_api';

type CheckScenario = { addMiddleware: boolean; loadDictionaries: boolean; init: boolean; final: boolean; opts?: { rootDic: boolean } };

const scenarios: CheckScenario[] = [
  { addMiddleware: true, loadDictionaries: true, init: true, final: true, opts: { rootDic: true } },
  { addMiddleware: false, loadDictionaries: true, init: true, final: true },
  { addMiddleware: false, loadDictionaries: false, init: true, final: true },
  { addMiddleware: false, loadDictionaries: false, init: false, final: true, opts: { rootDic: true } },
  { addMiddleware: false, loadDictionaries: false, init: false, final: false },
  { addMiddleware: false, loadDictionaries: false, init: true, final: false },
  { addMiddleware: true, loadDictionaries: true, init: true, final: false },
];

scenarios.forEach((scenario) => {
  const scenarioNames = Object.keys(scenario)
    .map((o) => (scenario[o] ? o : undefined))
    .filter((o) => o)
    .join(', ');

  describe(`factory [${scenarioNames}]`, () => {
    const config: DefaultTranslateConfig = { lang: 'test', fallbackLang: 'fallback test' };
    let injectedClass: InjectedTestClass;
    let injectedValue: InjectedValue;
    let result: { injToken: number; injService: number; middlewareCalled: number } & Partial<CheckScenario>;
    let service: TranslateRootService;

    beforeAll(async () => {
      injectedClass = new InjectedTestClass();
      injectedValue = { value: 0 };
      result = { injService: 0, injToken: 0, middlewareCalled: 0 };

      await factory(
        config,
        // INIT
        !scenario.init
          ? undefined
          : (service, injService: InjectedTestClass, injToken: { value: number }) =>
              of({ test_key_i: 'test_value_i' }).pipe(
                debounceTime(10),
                tap(() => {
                  injService.value++;
                  injToken.value++;
                  result.init = service instanceof TranslateService;
                }),
                map((res) => {
                  return { ['lang_i']: res };
                })
              ),
        // ADD MDLW
        !scenario.addMiddleware
          ? undefined
          : (injService: InjectedTestClass, injToken: { value: number }) => {
              result.addMiddleware = true;
              injService.value++;
              injToken.value++;
              return [
                (context) => {
                  result.middlewareCalled++;
                },
              ];
            },
        // LOAD DIC
        !scenario.loadDictionaries
          ? undefined
          : ({ lang, fallbackLang }, injService: InjectedTestClass, injToken: { value: number }) => {
              injService.value++;
              injToken.value++;
              return of({ test_key: 'test_value' }).pipe(
                debounceTime(10),
                tap(() => {
                  result.loadDictionaries = lang === 'test' && fallbackLang === 'fallback test';
                }),
                map((res) => {
                  return { [config.lang]: res };
                })
              );
            },
        // FINAL
        !scenario.final
          ? undefined
          : (service, injService: InjectedTestClass, injToken: { value: number }) => {
              injService.value++;
              injToken.value++;
              result.final = service instanceof TranslateService;
            }
      )(
        (service = new TranslateRootService(config, !scenario.opts?.rootDic ? undefined : { lang_r: { test_key_r: 'test_value_r' } })),
        ...[injectedClass, injectedValue]
      )();
    });

    it(`should be using correct injections`, () => {
      const count = Object.values(scenario).filter((v) => v === true).length;
      const tokenCount = injectedValue.value;
      const serviceCount = injectedClass.value;
      expect(tokenCount).toBe(count);
      expect(serviceCount).toBe(count);
    });

    it(`should have correct config`, () => {
      expect(service.lang).toBe(config.lang);
      expect(service.fallbackLang).toBe(config.fallbackLang);
    });

    it(`should have correct dictionary and call middleware`, () => {
      scenario.loadDictionaries && expect(service.translate('test_key')).toBe('test_value');
      scenario.init && expect(service.translateTo('lang_i', 'test_key_i')).toBe('test_value_i');
      scenario.opts?.rootDic && expect(service.translateTo('lang_r', 'test_key_r')).toBe('test_value_r');
      scenario.addMiddleware &&
        expect(result.middlewareCalled).toBe([scenario.loadDictionaries, scenario.init, scenario.opts?.rootDic].filter((o) => o === true).length);
      expect().nothing();
    });
  });
});
