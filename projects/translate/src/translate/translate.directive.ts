import { afterEveryRender, computed, Directive, effect, ElementRef, inject, input, OnInit, Renderer2, signal } from '@angular/core';
import { DictionaryEntry, TranslateDynamicProps, TranslateKey } from 'simply-translate';
import { TranslateService } from './translate.service';

@Directive({
  selector: '[translate]',
})
export class TranslateDirective implements OnInit {
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

    // null while there is no key to translate, which is different from a translation that comes out empty
    const translatedText = computed<string | null>(() => {
      const lang = this.to();
      this._service.stateVersion();

      const activeKey = finalKey();
      const fallbackValue = this.fallback() ?? (this._initialContent || undefined);

      const values = this.values();

      if (!activeKey) return null;

      if (lang) {
        return this._service.translateTo(lang, activeKey, values, fallbackValue);
      }

      return this._service.translate(activeKey, values, fallbackValue);
    });

    // a plain effect rather than afterRenderEffect, which never runs on the server
    effect(() => {
      const translated = translatedText();
      // No key yet: an interpolated key is filled in after this runs, so clearing
      // the text node now would erase it before it is read back.
      if (translated === null && this._lastOutput === null) {
        return;
      }
      const output = translated ?? '';
      this._rnd.setValue(this._textNode!, output);
      this._lastOutput = output;
    });

    // An interpolation inside the element rewrites the text node outside of signals, so it is read
    // back after every render. Browser only: on the server the key comes from the attribute or static content.
    afterEveryRender({
      read: () => {
        if (!this._textNode) {
          return;
        }
        const currentText = this._textNode.data.trim();
        // Skip a DOM read that's just our own last translated output reflected back —
        // otherwise the implicit key/fallback gets contaminated with a stale translation.
        if (currentText !== this._domContent() && currentText !== this._lastOutput?.trim()) {
          this._domContent.set(currentText);
        }
      },
    });
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

    this._rnd.setProperty(el, 'textContent', '');
    const textNode = this._rnd.createText('');
    this._rnd.appendChild(el, textNode);
    return textNode;
  }
}
