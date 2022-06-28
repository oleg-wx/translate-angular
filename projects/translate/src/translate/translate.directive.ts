import { Directive, ElementRef, Input, OnChanges, OnInit } from '@angular/core';
import { TranslateKey } from 'simply-translate';
import { TranslateService } from './translate.service';

@Directive({
  selector: '[translate]',
})
export class TranslateDirective implements OnInit, OnChanges {
  private _init = false;
  private _innerTextFallback?: string;
  @Input('fallback') _fallback?: string;
  @Input('translate') _key?: TranslateKey;
  @Input('to') _to?: string;
  @Input('values') _values?: { [key: string]: string | number };

  constructor(private element: ElementRef<HTMLElement>, private service: TranslateService) {}

  ngOnInit(): void {
    this._init = true;
  }

  ngOnChanges(): void {
    if (!this._init) this._innerTextFallback = this.element.nativeElement.innerText;

    if (this._key) {
      this.element.nativeElement.innerText = this.service.translateTo(this._to || this.service.lang!, this._key, this._values, this._fallback ?? this._innerTextFallback);
    } else {
      this.element.nativeElement.innerText = this._innerTextFallback || '';
    }
  }
}
