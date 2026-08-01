import { Injectable, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { TranslateRootService } from '../public_api';
import { TranslateModule } from '../simply-translate.module';
import { Namespace, String as Str, TranslateSchema } from '../translate/schema';
import { TranslateProxy } from '../translate/translate.proxy';

const testSchema = TranslateSchema({
  hello_user: Str<{ user: string }>(),
  strict_user: Str<{ user: string }>(),
  no_params: Str(),
  namespace: Namespace({
    hello_user: Str<{ user: string }>(),
  }),
});

@Injectable()
class TestTranslateProxy extends TranslateProxy<typeof testSchema> {}

const lang = 'lang';
const newLang = 'new';
const dic = {
  [lang]: {
    hello_user: 'Hello ${user}',
    strict_user: 'Strict ${user}',
    no_params: 'No params needed',
    namespace: { hello_user: 'NS Hello ${user}' },
  },
  [newLang]: {
    hello_user: 'Hello New ${user}',
    strict_user: 'Strict New ${user}',
    no_params: 'No params needed (new)',
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
    const obs1 = proxy.object.no_params.$();
    const obs2 = proxy.object.no_params.$();
    expect(obs1).toBe(obs2);
  });

  it('caches the signal returned by Signal()', () => {
    const sig1 = proxy.object.no_params.Signal();
    const sig2 = proxy.object.no_params.Signal();
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

  it('narrows the call signature, .Signal(), and .$() to the params declared on the schema leaf', () => {
    expect(proxy.object.strict_user({ user: 'Oleg' })).toBe('Strict Oleg');
    expect(proxy.object.strict_user.Signal({ user: 'Oleg' })()).toBe('Strict Oleg');
    expect(proxy.object.strict_user).toBeTruthy();

    // @ts-expect-error strict_user requires { user: string } — a number isn't assignable to it
    proxy.object.strict_user({ user: 42 });
    // @ts-expect-error same shape is enforced on .Signal(...)
    proxy.object.strict_user.Signal({ user: 42 });
    // @ts-expect-error same shape is enforced on .$(...)
    proxy.object.strict_user.$({ user: 42 });
    // @ts-expect-error { nope: true } doesn't satisfy the required { user: string } shape
    proxy.object.strict_user({ nope: true });
    // @ts-expect-error omitting the argument entirely is not allowed once TParams is declared
    proxy.object.strict_user();
  });

  it('a leaf declared with a bare Str()/Value() takes no dynamic props at all', () => {
    expect(proxy.object.no_params()).toBe('No params needed');
    expect(proxy.object.no_params.Signal()()).toBe('No params needed');

    // @ts-expect-error no_params has no declared TParams, so it must not accept an argument
    proxy.object.no_params({ user: 'Oleg' });
    // @ts-expect-error same restriction applies to .Signal(...)
    proxy.object.no_params.Signal({ user: 'Oleg' });
  });
});
