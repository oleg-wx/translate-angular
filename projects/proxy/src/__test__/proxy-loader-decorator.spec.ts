import { Injectable } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StringProp, TranslateSchema } from '../lib/schema';
import { TranslateProxy } from '../lib/translate.proxy';
import { TranslateProxyLoader } from '../lib/loader/translate-proxy-loader.decorator';
import { provideTranslate, TranslateRootService } from 'simply-translate-angular';
import { tick } from './core/tick';

const lang = 'lang';

const commonSchema = TranslateSchema({ ok: StringProp() });

@Injectable({ providedIn: 'root' })
@TranslateProxyLoader({
  id: 'common',
  dictionaries: { [lang]: { ok: 'Ok' } },
})
class CommonTranslate extends TranslateProxy<typeof commonSchema> {}

const featureSchema = TranslateSchema({ ok: StringProp(), title: StringProp() });

@Injectable({ providedIn: 'root' })
@TranslateProxyLoader({
  id: 'feature',
  extends: [CommonTranslate],
  dictionaries: { [lang]: { title: 'Title' } },
})
class FeatureTranslate extends TranslateProxy<typeof featureSchema> {}

const readyCalls: { lang: string; id: string }[] = [];

@Injectable({ providedIn: 'root' })
@TranslateProxyLoader({
  id: 'reported',
  dictionaries: { [lang]: { ok: 'Ok' } },
})
class ReportedTranslate extends TranslateProxy<typeof commonSchema> {
  onLoaderReady(args: { lang: string; id: string }): void {
    readyCalls.push(args);
  }
}

@Injectable({ providedIn: 'root' })
@TranslateProxyLoader({
  id: 'fields',
  dictionaries: { [lang]: { ok: 'Ok' } },
})
class FieldsTranslate extends TranslateProxy<typeof commonSchema> {
  readonly readyLangs: string[] = [];

  onLoaderReady(args: { lang: string; id: string }): void {
    this.readyLangs.push(args.lang);
  }
}

describe('TranslateProxyLoader decorator', () => {
  beforeEach(() => {
    readyCalls.length = 0;
    TestBed.configureTestingModule({
      providers: [provideTranslate({ lang }), provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
    });
  });

  it('reports a plain-object dictionary to onLoaderReady', async () => {
    TestBed.inject(ReportedTranslate);
    await tick(0);

    expect(readyCalls).toEqual([{ lang, id: 'reported' }]);
  });

  it('reports to onLoaderReady once the subclass fields are initialized', async () => {
    const proxy = TestBed.inject(FieldsTranslate);
    await tick(0);

    expect(proxy.readyLangs).toEqual([lang]);
  });

  it('does not report to onLoaderReady once destroyed, even a load that finished before', async () => {
    const proxy = TestBed.inject(FieldsTranslate);
    proxy.ngOnDestroy();
    await tick(0);

    expect(proxy.readyLangs).toEqual([]);
  });

  it('loads its own dictionary without being injected directly anywhere', () => {
    const feature = TestBed.inject(FeatureTranslate);

    expect(feature.object.title()).toBe('Title');
  });

  it('also loads an `extends`-listed proxy dictionary, without that proxy ever being injected directly', () => {
    const feature = TestBed.inject(FeatureTranslate);

    expect(feature.object.ok()).toBe('Ok');
  });

  it('does not require the extended proxy to be injected/used anywhere else first', () => {
    const root = TestBed.inject(TranslateRootService);

    // No `TestBed.inject(CommonTranslate)` anywhere in this spec — only FeatureTranslate is ever asked for.
    const feature = TestBed.inject(FeatureTranslate);

    expect(root.translate('ok')).toBe('Ok');
    expect(feature.object.ok()).toBe('Ok');
  });
});