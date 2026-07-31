import { Dictionary, DictionaryEntry } from 'simply-translate';

import { TranslateSchema, Value } from 'projects/translate/src/public_api';

export const testDictionary = TranslateSchema({
  hello_user_dynamic: Value(),
  same_dyn: Value(),
});
