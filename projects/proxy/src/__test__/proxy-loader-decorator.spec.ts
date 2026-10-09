import { Injectable } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StringProp, TranslateSchema } from '../lib/schema';
import { TranslateProxy } from '../lib/translate.proxy';
import { TranslateProxyLoader } from '../lib/loader/translate-proxy-loader.decorator';
import { TranslateModule, TranslateRootService } from 'simply-translate-angular';

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

describe('TranslateProxyLoader decorator', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot({ lang })],
    });
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
