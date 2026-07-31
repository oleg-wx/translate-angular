import { Injectable } from '@angular/core';
import { TranslateProxy } from '../../projects/translate/src/translate/translate.proxy';
import type { testDictionary } from 'src/assets/translations/_';

@Injectable({ providedIn: 'root' })
export class TranslateProxyCommon extends TranslateProxy<typeof testDictionary> {}
