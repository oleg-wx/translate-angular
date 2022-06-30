import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { debounceTime, lastValueFrom, map, of, Subject } from 'rxjs';
import { TranslateRootService, TranslateService, DEFAULT_DIRECTIVE_CONFIG } from '../public_api';
import { TranslateModule } from '../simply-translate.module';
import { tick } from './core/tick';

@Component({
  template: `
    <div id="d1" translate="hello_user" [values]="{ user: 'Oleg' }" detect></div>
    <div id="d2">{{ 'hello_user' | translate$: { user: 'Oleg' } }}</div>
    <test-component-detect></test-component-detect>
  `,
})
export class TestComponent {}

@Component({
  selector: 'test-component-detect',
  template: ` <div id="d_d1" translate="hello_user" [values]="{ user: 'Oleg' }"></div> `,
  providers: [{ provide: DEFAULT_DIRECTIVE_CONFIG, useValue: { detect: true } }],
})
export class TestComponentDetect {}

const lang = 'lang';
const newLang = 'new';
const dic = {
  [lang]: {
    hello_user: 'Hello ${user}',
  },
  [newLang]: {
    hello_user: 'Hello New ${user}',
  },
};

const _wait = new Subject<void>();
_wait.next();

describe('language change detect', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [TestComponent, TestComponentDetect],
      imports: [
        TranslateModule.forRoot({
          lang,
          dictionaries: dic,
          final: () => {
            _wait.next();
            _wait.complete();
          },
        }),
      ],
    });
  });

  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let element: HTMLElement;
  let root: TranslateRootService;
  let service: TranslateService;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TestComponent);
    await lastValueFrom(_wait.asObservable(), { defaultValue: 0 });
    root = TestBed.inject(TranslateRootService);
    service = TestBed.inject(TranslateService);
  });

  beforeEach(async () => {
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();

    element = fixture.elementRef.nativeElement;
    // rootService = component.root;
    // service = component.service;
  });

  it('should translate after change', async () => {
    expect(service.lang).toBe(lang);
    expect(element.querySelector<HTMLElement>('#d1').innerText.trim()).toBe('Hello Oleg');
    expect(element.querySelector<HTMLElement>('#d2').innerText.trim()).toBe('Hello Oleg');

    let newLangEvent: string, oldLangEvent: string;

    const sub = root.languageChange$.subscribe((val) => {
      newLangEvent = val.lang;
      oldLangEvent = val.oldLang;
    });

    root.lang = newLang;
    fixture.detectChanges();

    await tick(100);

    await fixture.whenStable();
    await fixture.whenRenderingDone();

    expect(root.lang).toBe(newLang);
    expect(newLangEvent).toBe(newLang);
    expect(oldLangEvent).toBe(lang);

    expect(element.querySelector<HTMLElement>('#d1').innerText.trim()).toBe('Hello New Oleg');
    expect(element.querySelector<HTMLElement>('#d_d1').innerText.trim()).toBe('Hello New Oleg');
    expect(element.querySelector<HTMLElement>('#d2').innerText.trim()).toBe('Hello New Oleg');
    sub.unsubscribe();
  });

  it('should emit events on change', async () => {
    let newLangEvent1: string, oldLangEvent1: string, newLangEvent2: string, oldLangEvent2: string;

    const sub1 = root.languageChange$.subscribe((val) => {
      newLangEvent1 = val.lang;
      oldLangEvent1 = val.oldLang;
    });

    const sub2 = service.languageChange$.subscribe((val) => {
      newLangEvent2 = val.lang;
      oldLangEvent2 = val.oldLang;
    });

    root.lang = newLang;
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();

    expect(service.lang).toBe(newLang);
    expect(root.lang).toBe(newLang);
    expect(newLangEvent1).toBe(newLang);
    expect(oldLangEvent1).toBe(lang);
    expect(newLangEvent2).toBe(newLang);
    expect(oldLangEvent2).toBe(lang);

    sub1.unsubscribe();
    sub2.unsubscribe();
  });
});
