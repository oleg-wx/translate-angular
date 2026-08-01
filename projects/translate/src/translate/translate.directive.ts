import { computed, Directive, effect, ElementRef, inject, input, OnInit, signal } from '@angular/core';
import { DictionaryEntry, TranslateKey } from 'simply-translate';
import { TranslateService } from './translate.service';

@Directive({
  selector: '[translate]',
})
export class TranslateDirective implements OnInit {
  private _element: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);
  private _service: TranslateService = inject(TranslateService);

  private domContent = signal<string>('');
  private _textNode: Text | null = null;
  private _lastOutput: string | null = null;

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
      const lang = this.to();
      this._service.stateVersion();

      const activeKey = finalKey();
      const fallbackValue = this.fallback();

      const values = this.values();

      if (!activeKey) return '';

      if (lang) {
        return this._service.translateTo(lang, activeKey, values as any, fallbackValue);
      }

      return this._service.translate(activeKey, values as any, fallbackValue);
    });

    effect(() => {
      const output = translatedText();
      this._textNode!.data = output;
      this._lastOutput = output;
    });
  }

  ngAfterViewChecked(): void {
    if (this._textNode) {
      const currentText = this._textNode.data.trim();
      // Skip a DOM read that's just our own last translated output reflected back —
      // otherwise the implicit key/fallback gets contaminated with a stale translation.
      if (currentText !== this.domContent() && currentText !== this._lastOutput) {
        this.domContent.set(currentText);
      }
    }
  }

  ngOnInit(): void {
    this._textNode = this._resolveTextNode();
    this.domContent.set(this._textNode.data.trim());
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
