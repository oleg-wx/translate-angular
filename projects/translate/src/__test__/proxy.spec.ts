import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateRootService } from '../public_api';
import { TranslateModule } from '../simply-translate.module';
import { TranslateProxy } from '../translate/translate.proxy';

interface TestDict {
  [key: string]: any;
  hello_user: string;
  namespace: {
    hello_user: string;
  };
}

@Injectable()
class TestTranslateProxy extends TranslateProxy<TestDict> {}

const lang = 'lang';
const newLang = 'new';
const dic = {
  [lang]: {
    hello_user: 'Hello ${user}',
    namespace: { hello_user: 'NS Hello ${user}' },
  },
  [newLang]: {
    hello_user: 'Hello New ${user}',
    namespace: { hello_user: 'NS Hello New ${user}' },
  },
};

describe('TranslateProxy', () => {
  let proxy: TestTranslateProxy;
  let root: TranslateRootService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestTranslateProxy],
      imports: [
        TranslateModule.forRoot({
          lang,
          dictionaries: dic,
        }),
      ],
    });

    root = TestBed.inject(TranslateRootService);
    proxy = TestBed.inject(TestTranslateProxy);
  });

  it('translates leaf keys via direct call', () => {
    expect(proxy.object.hello_user({ user: 'Oleg' })).toBe('Hello Oleg');
  });

  it('translates nested keys via direct call', () => {
    expect(proxy.object.namespace.hello_user({ user: 'Oleg' })).toBe('NS Hello Oleg');
  });

  it('caches proxy nodes so repeated access returns the same reference', () => {
    expect(proxy.object.hello_user).toBe(proxy.object.hello_user);
    expect(proxy.object.namespace).toBe(proxy.object.namespace);
    expect(proxy.object.namespace.hello_user).toBe(proxy.object.namespace.hello_user);
  });

  it('caches the observable returned by $()', () => {
    const obs1 = proxy.object.hello_user.$();
    const obs2 = proxy.object.hello_user.$();
    expect(obs1).toBe(obs2);
  });

  it('caches the signal returned by Signal()', () => {
    const sig1 = proxy.object.hello_user.Signal();
    const sig2 = proxy.object.hello_user.Signal();
    expect(sig1).toBe(sig2);
  });

  it('keeps reacting to language changes despite caching the observable/signal', () => {
    const values: string[] = [];
    const sub = proxy.object.hello_user.$({ user: 'Oleg' }).subscribe((v) => values.push(v));
    const signal = proxy.object.hello_user.Signal({ user: 'Oleg' });

    expect(signal()).toBe('Hello Oleg');

    root.lang = newLang;

    expect(values).toEqual(['Hello Oleg', 'Hello New Oleg']);
    expect(signal()).toBe('Hello New Oleg');

    sub.unsubscribe();
  });

  it('toString returns the full dotted translation key', () => {
    expect(String(proxy.object.hello_user)).toBe('hello_user');
    expect(String(proxy.object.namespace.hello_user)).toBe('namespace.hello_user');
    expect(`${proxy.object.namespace.hello_user}`).toBe('namespace.hello_user');
  });

  it('does not look like a thenable', () => {
    expect((proxy.object.hello_user as any).then).toBeUndefined();
  });
});
