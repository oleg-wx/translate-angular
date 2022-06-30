import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { debounceTime, lastValueFrom, of, Subject } from 'rxjs';
import { TranslateDirective } from 'simply-translate-angular';
import { DefaultTranslateConfig, DEFAULT_CONFIG, ROOT_DICTIONARIES, TranslateRootService, TranslateService } from '../public_api';
import { TranslateModule } from '../simply-translate.module';
import { TestInjectedServiceComponent } from './core/test.component';

@Component({
  template: `
    <div id="d1" translate="hello_user" [values]="{ user: 'Oleg' }"></div>
    <div id="d2">{{ 'hello_user' | translate: { user: 'Oleg' } }}</div>
  `,
})
export class TestComponent {}

describe('language change ignore', () => {
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

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [TestComponent],
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

    component = fixture.componentInstance;
    root = TestBed.inject(TranslateRootService);
    service = TestBed.inject(TranslateService);

    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();

    element = fixture.elementRef.nativeElement;
    // rootService = component.root;
    // service = component.service;
  });

  it('should ignore after change', async () => {
    expect(service.lang).toBe(lang);
    expect(element.querySelector<HTMLElement>('#d1').innerText.trim()).toBe('Hello Oleg');
    expect(element.querySelector<HTMLElement>('#d2').innerText.trim()).toBe('Hello Oleg');

    let newLangEvent: string, oldLangEvent: string;

    const sub = root.languageChange$.subscribe((val) => {
      (newLangEvent = val.lang), (oldLangEvent = val.oldLang);
    });

    root.lang = newLang;
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();

    expect(service.lang).toBe(newLang);
    expect(newLangEvent).toBe(newLang);
    expect(oldLangEvent).toBe(lang);

    expect(element.querySelector<HTMLElement>('#d1').innerText.trim()).toBe('Hello Oleg');
    expect(element.querySelector<HTMLElement>('#d2').innerText.trim()).toBe('Hello Oleg');
  });
});
