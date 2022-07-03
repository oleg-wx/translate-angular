import { Directive, ElementRef, Inject, InjectionToken, Input, OnChanges, OnDestroy, OnInit, Optional } from '@angular/core';
import { skip, Subscription } from 'rxjs';
import { DictionaryEntry, TranslateKey } from 'simply-translate';
import { TranslateService } from './translate.service';

export interface DefaultTranslateDirectiveConfig {
  detect?: boolean;
}

export const DEFAULT_DIRECTIVE_CONFIG = new InjectionToken<DefaultTranslateDirectiveConfig>('TranslateDirective DEFAULT_CONFIG');

@Directive({
  selector: '[translate]',
})
export class TranslateDirective implements OnInit, OnChanges, OnDestroy {
  private _shouldDetectLangChange: boolean = false;
  private _sub?: Subscription;
  private _init = false;
  private _innerTextFallback?: string;
  @Input('fallback') _fallback?: DictionaryEntry | string;
  @Input('translate') _key?: TranslateKey;
  @Input('to') _to?: string;
  @Input('values') _values?: { [key: string]: string | number };
  @Input() detect: '' | undefined;

  constructor(
    private _element: ElementRef<HTMLElement>,
    private _service: TranslateService,
    @Optional()
    @Inject(DEFAULT_DIRECTIVE_CONFIG)
    config: DefaultTranslateDirectiveConfig
  ) {
    this._shouldDetectLangChange = !!(config?.detect ?? _element.nativeElement.hasAttribute('detect'));
  }

  ngOnChanges(): void {
    if (!this._init) this._innerTextFallback = this._element.nativeElement.innerText;

    if (this._key) {
      this._element.nativeElement.innerText = this._service.translateTo(
        this._to ?? this._service.lang!,
        this._key,
        this._values,
        this._fallback ?? this._innerTextFallback
      );
    } else {
      this._element.nativeElement.innerText = this._innerTextFallback || '';
    }
  }

  ngOnInit(): void {
    this._init = true;
    if (this._shouldDetectLangChange) {
      this._subscribeChanges();
    }
  }

  private _subscribeChanges() {
    this._sub = new Subscription();
    this._sub.add(
      this._service.languageChange$.pipe(skip(1)).subscribe((lang) => {
        if (!this._to) {
          this.ngOnChanges();
        }
      })
    );
    this._sub.add(
      this._service.dictionaryChange$.pipe(skip(1)).subscribe(() => {
        this.ngOnChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this._init = true;
    this._sub?.unsubscribe();
  }
}
