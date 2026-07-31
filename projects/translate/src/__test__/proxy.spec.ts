import { Injectable, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { TranslateRootService } from '../public_api';
import { TranslateModule } from '../simply-translate.module';
import { Namespace, String as Str, TranslateSchema } from '../translate/schema';
import { TranslateProxy } from '../translate/translate.proxy';

const testSchema = TranslateSchema({
  hello_user: Str(),
  namespace: Namespace({
    hello_user: Str(),
  }),
});

@Injectable()
class TestTranslateProxy extends TranslateProxy<typeof testSchema> {}

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

  it('does not reuse a cached signal across different dynamicProps objects', () => {
    const sigOleg = proxy.object.hello_user.Signal({ user: 'Oleg' });
    const sigDana = proxy.object.hello_user.Signal({ user: 'Dana' });
    const ref = { user: 'John' };
    const sigRef = proxy.object.hello_user.Signal(ref);
    const sigRef2 = proxy.object.hello_user.Signal(ref);

    expect(sigRef).toBe(sigRef2);
    expect(sigOleg).not.toBe(sigDana);
    expect(sigOleg()).toBe('Hello Oleg');
    expect(sigDana()).toBe('Hello Dana');
  });

  it('does not reuse a cached observable across different dynamicProps objects', (done) => {
    const values1: string[] = [];
    const values2: string[] = [];

    const obs1 = proxy.object.hello_user.$({ user: 'Oleg' });
    const obs2 = proxy.object.hello_user.$({ user: 'Dana' });
    expect(obs1).not.toBe(obs2);

    obs1.subscribe((v) => values1.push(v));
    obs2.subscribe((v) => {
      values2.push(v);
      expect(values1).toEqual(['Hello Oleg']);
      expect(values2).toEqual(['Hello Dana']);
      done();
    });
  });

  it('reuses the cached signal/observable when the same dynamicProps reference is passed again', () => {
    const props = { user: 'Oleg' };
    expect(proxy.object.hello_user.Signal(props)).toBe(proxy.object.hello_user.Signal(props));
    expect(proxy.object.hello_user.$(props)).toBe(proxy.object.hello_user.$(props));
  });

  it('reacts to changes when dynamicProps is a Signal', () => {
    const paramsSignal1 = signal({ user: 'Oleg' });
    const translated1 = proxy.object.hello_user.Signal(paramsSignal1);

    const paramsSignal2 = signal({ user: 'John' });
    const translated2 = proxy.object.hello_user.Signal(paramsSignal2);

    expect(translated1()).toBe('Hello Oleg');
    expect(translated2()).toBe('Hello John');
    expect(translated1()).toBe('Hello Oleg');

    paramsSignal1.set({ user: 'Dana' });

    expect(translated1()).toBe('Hello Dana');
    expect(translated2()).toBe('Hello John');
  });

  it('reacts to changes when dynamicProps is an Observable', () => {
    const paramsObservable1$ = new BehaviorSubject({ user: 'Oleg' });
    const values1: string[] = [];
    const sub1 = proxy.object.hello_user.$(paramsObservable1$).subscribe((v) => values1.push(v));

    const paramsObservable2$ = new BehaviorSubject({ user: 'John' });
    const values2: string[] = [];
    const sub2 = proxy.object.hello_user.$(paramsObservable2$).subscribe((v) => values2.push(v));

    expect(values1).toEqual(['Hello Oleg']);
    expect(values2).toEqual(['Hello John']);

    paramsObservable1$.next({ user: 'Dana' });

    expect(values1).toEqual(['Hello Oleg', 'Hello Dana']);
    expect(values2).toEqual(['Hello John']);

    sub1.unsubscribe();
    sub2.unsubscribe();
  });

  it('reuses the cached signal/observable when the same Signal/Observable reference is passed again', () => {
    const paramsSignal = signal({ user: 'Oleg' });
    const paramsObservable$ = new BehaviorSubject({ user: 'Oleg' });

    expect(proxy.object.hello_user.Signal(paramsSignal)).toBe(proxy.object.hello_user.Signal(paramsSignal));
    expect(proxy.object.hello_user.$(paramsObservable$)).toBe(proxy.object.hello_user.$(paramsObservable$));
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
