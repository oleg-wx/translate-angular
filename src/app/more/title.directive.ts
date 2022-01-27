import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appTitle]',
})
export class TitleDirective implements OnChanges {
  @Input('appTitle')
  title: string;

  constructor(private _el: ElementRef<HTMLElement>) {}
  ngOnChanges(changes: SimpleChanges): void {
    this._el.nativeElement.title = changes.title.currentValue;
  }
}
