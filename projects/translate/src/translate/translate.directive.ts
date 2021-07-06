import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from './translate.service';

@Directive({
    selector: '[translate]',
})
export class TranslateDirective implements OnInit, OnChanges {
    private _init = false;
    private _fb?: string;
    @Input('translate') _key?: string;
    @Input('to') _to?: string;
    @Input('values') _values?: { [key: string]: string | number };

    constructor(private element: ElementRef<HTMLElement>, private service: TranslateService) {}

    ngOnInit(): void {
        this._init = true;
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (!this._init) this._fb = this.element.nativeElement.innerText;

        if (this._key) {
            this.element.nativeElement.innerText = this.service.translateTo(
                this._to || this.service.defaultLang!,
                this._key,
                this._values,
                this._fb
            );
        } else if (this._fb !== this.element.nativeElement.innerText) {
            this.element.nativeElement.innerText = this._fb || '';
        }
    }
}
