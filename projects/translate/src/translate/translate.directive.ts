import { AfterViewChecked, computed, Directive, effect, ElementRef, inject, input, OnInit, Renderer2, signal } from '@angular/core';
import { DictionaryEntry, TranslateDynamicProps, TranslateKey } from 'simply-translate';
import { TranslateService } from './translate.service';

@Directive({
  selector: '[translate]',
})
export class TranslateDirective implements OnInit, AfterViewChecked {
  private _element = inject<ElementRef<HTMLElement>>(ElementRef);
  private _service = inject(TranslateService);
  private _rnd = inject(Renderer2);
  private _domContent = signal<string>('');
  private _textNode: Text | null = null;
  private _lastOutput: string | null = null;
  private _initialContent = '';

  readonly fallback = input<DictionaryEntry | string | undefined>(undefined);
  readonly key = input<TranslateKey | undefined>(undefined, { alias: 'translate' });
  readonly to = input<string | undefined>(undefined);
  readonly values = input<TranslateDynamicProps | undefined>(undefined);

  constructor() {
    const finalKey = computed(() => {
      const boundKey = this.key();
      if (boundKey !== undefined && boundKey !== '') {
        return boundKey;
      }
      return this._domContent();
    });

    const translatedText = computed(() => {
      const lang = this.to();
      this._service.stateVersion();

      const activeKey = finalKey();
      const fallbackValue = this.fallback() ?? (this._initialContent || undefined);

      const values = this.values();

      if (!activeKey) return '';

      if (lang) {
        return this._service.translateTo(lang, activeKey, values, fallbackValue);
      }

      return this._service.translate(activeKey, values, fallbackValue);
    });

    effect(() => {
      const output = translatedText();
      // Nothing to show yet: an interpolated key is filled in after this runs, so clearing
      // the text node now would erase it before it is read back.
      if (output === '' && this._lastOutput === null) {
        return;
      }
      this._textNode!.data = output;
      this._lastOutput = output;
    });
  }

  ngAfterViewChecked(): void {
    if (this._textNode) {
      const currentText = this._textNode.data.trim();
      // Skip a DOM read that's just our own last translated output reflected back —
      // otherwise the implicit key/fallback gets contaminated with a stale translation.
      if (currentText !== this._domContent() && currentText !== this._lastOutput?.trim()) {
        this._domContent.set(currentText);
      }
    }
  }

  ngOnInit(): void {
    this._textNode = this._resolveTextNode();
    this._initialContent = this._textNode.data.trim();
    this._domContent.set(this._initialContent);
  }

  private _resolveTextNode(): Text {
    const el = this._element.nativeElement;

    if (el.childNodes.length === 1 && el.firstChild?.nodeType === el.TEXT_NODE) {
      return el.firstChild as Text;
    }

    el.textContent = '';
    const textNode = this._rnd.createText('');
    el.appendChild(textNode);
    return textNode;
  }
}
