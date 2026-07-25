import { computed, Directive, effect, ElementRef, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { DictionaryEntry, TranslateKey } from 'simply-translate';
import { TranslateService } from './translate.service';

@Directive({
  selector: '[translate]',
})
export class TranslateDirective implements OnInit, OnDestroy {
  private _element: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);
  private _service: TranslateService = inject(TranslateService);

  private domContent = signal<string>('');
  private observer: MutationObserver | null = null;
  private _textNode: Text | null = null;

  fallback = input<DictionaryEntry | string | undefined>(undefined);
  key = input<TranslateKey | undefined>(undefined, { alias: 'translate' });
  to = input<string | undefined>(undefined);
  values = input<{ [key: string]: string | number } | undefined>(undefined);

  constructor() {
    const finalKey = computed(() => {
      const boundKey = this.key();
      if (boundKey !== undefined && boundKey !== '') {
        return boundKey;
      }
      return this.domContent();
    });

    const translatedText = computed(() => {
      const activeKey = finalKey();
      if (!activeKey) return '';

      const fallbackValue = this.fallback() ?? (this.domContent() || undefined);
      const lang = this.to();

      if (lang) {
        this._service.stateVersion();
        return this._service.translateTo(lang, activeKey, this.values() as any, fallbackValue);
      }

      return this._service.translateSignal(activeKey, this.values() as any, fallbackValue)();
    });

    effect(() => {
      const output = translatedText();

      this.observer?.disconnect();

      this._textNode!.data = output;

      this.observer?.observe(this._element.nativeElement, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
  }

  ngAfterViewChecked(): void {
    if (this._textNode) {
      const currentText = this._textNode.data.trim();
      if (currentText !== this.domContent()) {
        this.domContent.set(currentText);
      }
    }
  }

  ngOnInit(): void {
    debugger;
    this._textNode = this._resolveTextNode();
    this.domContent.set(this._textNode.data.trim());

    this.observer = new MutationObserver(() => {
      const currentText = this._textNode!.data.trim();
      if (currentText !== this.domContent()) {
        this.domContent.set(currentText);
      }
    });

    this.observer.observe(this._element.nativeElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private _resolveTextNode(): Text {
    const el = this._element.nativeElement;

    if (el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE) {
      return el.firstChild as Text;
    }

    el.textContent = '';
    const textNode = document.createTextNode('');
    el.appendChild(textNode);
    return textNode;
  }
}
