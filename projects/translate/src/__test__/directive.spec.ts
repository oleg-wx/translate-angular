import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { debounceTime, lastValueFrom, of, Subject } from 'rxjs';
import { Dictionaries } from 'simply-translate';
import { DefaultTranslateConfig, provideTranslate, TRANSLATE_IMPORTS, withDictionaries } from '../public_api';
import { TranslateModule } from '../simply-translate.module';

@Component({
  template: `
    <div id="d1" translate="hello_user" [values]="{ user: 'Oleg' }"></div>
    <div id="d2" translate="hello_user" to="ru-RU" [values]="{ user: 'Oleg' }"></div>
    <div id="d3" translate="hello_user_not_there" [values]="{ user: 'Oleg' }">Hello user fb</div>
    <div id="d4" translate="hello_user_not_there" [values]="{ user: 'Oleg' }">Hello $&#123;user&#125; fb</div>
    <div id="d5" translate="hello_user_not_there" [values]="{ user: 'Oleg' }" fallback="Hello $&#123;user&#125; fb"></div>
    <div
      id="d6"
      translate="hello_user_not_there"
      [values]="{ user: 'Oleg', num: 5 }"
      [fallback]="{ value: 'Hello \${user} \${num} fb', plural: { num: [['=5', 'five']] } }"
    ></div>
    <div id="d7" translate="hello_user_not_there"></div>
    <div id="d8" translate="hello_user_not_there_fallback" fallback="hello_user_fallback_param"></div>
    <div id="d9" translate="hello_user_not_there_fallback">hello_user_fallback_content</div>
  `,
  standalone: false,
})
export class TestDirectiveComponent {}

describe('directive', () => {
  const config: DefaultTranslateConfig = {
    lang: 'test',
  };
  const rootDic: Dictionaries = {
    [config.lang]: {
      hello_user: 'Hello ${user}',
    },
  };
  const dic = {
    ['ru-RU']: {
      hello_user: 'Hello ru ${user}',
    },
  };

  const _wait = new Subject<void>();
  _wait.next();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [TestDirectiveComponent],
      imports: [
        TranslateModule.forRoot({
          ...config,
          dictionaries: rootDic,
          loadDictionaries: () => of(dic).pipe(debounceTime(10)),
          final: () => {
            _wait.next();
            _wait.complete();
          },
        }),
      ],
    });
  });

  let component: TestDirectiveComponent;
  let fixture: ComponentFixture<TestDirectiveComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TestDirectiveComponent);

    await lastValueFrom(_wait.asObservable(), { defaultValue: 0 });

    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();

    element = fixture.elementRef.nativeElement;
  });

  it('translates a known key with bound values', () => {
    expect(element.querySelector<HTMLElement>('#d1').innerText.trim()).toBe('Hello Oleg');
  });

  it('translates to an explicit language via [to]', () => {
    expect(element.querySelector<HTMLElement>('#d2').innerText.trim()).toBe('Hello ru Oleg');
  });

  it('falls back to the static DOM content when the key is missing and no fallback is bound', () => {
    expect(element.querySelector<HTMLElement>('#d3').innerText.trim()).toBe('Hello user fb');
  });

  it('interpolates values into DOM content used as a fallback', () => {
    expect(element.querySelector<HTMLElement>('#d4').innerText.trim()).toBe('Hello Oleg fb');
  });

  it('interpolates values into an explicit string fallback', () => {
    expect(element.querySelector<HTMLElement>('#d5').innerText.trim()).toBe('Hello Oleg fb');
  });

  it('resolves plural cases in an explicit fallback object', () => {
    expect(element.querySelector<HTMLElement>('#d6').innerText.trim()).toBe('Hello Oleg five fb');
  });

  it('shows the raw key when neither a translation nor a fallback is available', () => {
    expect(element.querySelector<HTMLElement>('#d7').innerText.trim()).toBe('hello_user_not_there');
  });

  it('uses an explicit fallback attribute over static DOM content', () => {
    expect(element.querySelector<HTMLElement>('#d8').innerText.trim()).toBe('hello_user_fallback_param');
  });

  it('falls back to static DOM content that looks like a translation key', () => {
    expect(element.querySelector<HTMLElement>('#d9').innerText.trim()).toBe('hello_user_fallback_content');
  });
});

@Component({
  imports: [TRANSLATE_IMPORTS],
  template: `
    <div id="static" translate>hello</div>
    <div id="trailing-space" translate>hello_user</div>
    <div id="interpolated" translate [values]="{ user: 'Oleg' }">{{ key() }}</div>
  `,
})
class InnerContentKeyComponent {
  key = signal('hello_user');
}

describe('directive with the key in its content', () => {
  let fixture: ComponentFixture<InnerContentKeyComponent>;
  const text = (id: string) => fixture.nativeElement.querySelector(`#${id}`).textContent.trim();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideTranslate({ lang: 'test' }, withDictionaries({ test: { hello: 'Hello', hello_user: 'Hello ${user}', bye_user: 'Bye ${user}' } }))],
    });
    fixture = TestBed.createComponent(InnerContentKeyComponent);
    // with zone.js the fixture only re-renders on its own once auto detection is on, as an application would;
    // the content is read back after rendering, which schedules one more pass
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('uses static content as the key', () => {
    expect(text('static')).toBe('Hello');
  });

  it('keeps a translation that ends in whitespace instead of reading it back as a key', () => {
    // no value for ${user} leaves "Hello "
    expect(text('trailing-space')).toBe('Hello');
  });

  it('uses interpolated content as the key', () => {
    expect(text('interpolated')).toBe('Hello Oleg');
  });

  it('follows the interpolated key when it changes', async () => {
    fixture.componentInstance.key.set('bye_user');
    await fixture.whenStable();

    expect(text('interpolated')).toBe('Bye Oleg');
  });
});
