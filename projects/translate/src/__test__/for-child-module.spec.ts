import { Component, ContentChildren, ElementRef, Inject, Injectable, InjectionToken, NgModule, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule, Routes } from '@angular/router';
import { debounceTime, lastValueFrom, of, Subject } from 'rxjs';
import { DefaultTranslateConfig, DEFAULT_CONFIG, ROOT_DICTIONARIES, TranslateRootService, TranslateService,TranslateResolve } from '../public_api';
import { TranslateModule } from '../simply-translate.module';
import { InjectedValue, INJECTED_TOKEN, TestInjectedServiceComponent } from './core/test.component';
import { RouterTestingModule } from '@angular/router/testing';
import { tick } from './core/tick';

export const INJECTED_COMP = new InjectionToken<any>('INJECTED_COMP');

const config: DefaultTranslateConfig = {
  lang: 'test',
  fallbackLang: 'fallback',
};

const rootDic = {
  [config.lang]: {
    hello_user: 'Hello User',
  },
};

const childeDic = {
  [config.lang]: {
    hello_user: 'Hello USER Child',
  },
};

@Component({
  template: `<div>B</div>`,
})
export class TestComponent {}

@Component({
  template: `<div id="dyn" translate="hello_user" fallback="fallback"></div>`,
})
export class TestComponentDyn {
  constructor(
    public element: ElementRef<HTMLElement>,
    public service: TranslateService,
    @Inject(INJECTED_TOKEN) public value: InjectedValue,
    @Inject(INJECTED_COMP) public comp: any
  ) {
    comp.component = this;
  }
}

@Component({
  selector: 'root',
  template: `<router-outlet></router-outlet>`,
})
export class TestComponentRoot {
  @ContentChildren(TestComponentDyn, { descendants: true })
  public components: QueryList<TestComponentDyn>;

  constructor(public router: Router) {
    router.navigate(['child']);
  }
}

const routes: Routes = [
  { path: '', component: TestComponent },
  { path: 'child', loadChildren: () => DynamicModule, resolve: { translate: TranslateResolve } },
];

@NgModule({
  declarations: [TestComponentDyn],
  providers: [{ provide: INJECTED_TOKEN, useValue: { value: 100 } }],
  imports: [
    RouterTestingModule.withRoutes([
      {
        path: '',
        component: TestComponentDyn,
      },
    ]),
    TranslateModule.forChild({
      deps: [INJECTED_TOKEN],
      id: 'child',
      loadDictionaries: (lang, value: InjectedValue) => {
        value.value = 100;
        return of(childeDic);
      },
    }),
  ],
})
export class DynamicModule {}

// TO DO:
xdescribe('forChild init', () => {
  const _wait = new Subject<void>();
  _wait.next();

  let component: TestInjectedServiceComponent;
  let rootService: TranslateRootService;
  let service: TranslateService;
  let fixture: ComponentFixture<TestComponentRoot>;
  let element: HTMLElement;
  let comp;

  let chidIng: number = 0;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: INJECTED_COMP, useValue: {} }],
      imports: [
        RouterTestingModule.withRoutes(routes),
        TranslateModule.forRoot({
          ...config,
          dictionaries: rootDic,
          final: () => {
            _wait.next();
            _wait.complete();
          },
        }),
      ],
      declarations: [TestInjectedServiceComponent, TestComponent, TestComponentRoot],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(TestComponentRoot);
    await lastValueFrom(_wait.asObservable(), { defaultValue: 0 });
  });

  beforeEach(async () => {
    // component = fixture.componentInstance.testComponent;
    // rootService = component.root;
    // service = component.service;
    comp = TestBed.inject(INJECTED_COMP);
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();
    element = fixture.elementRef.nativeElement;
  });

  it('should translate', async () => {
    await tick(300);
    fixture.debugElement;
    fixture.elementRef.nativeElement;
    expect(element.querySelector<HTMLElement>('#dyn').innerText.trim()).toBe('Hello USER Child');
  });
});
