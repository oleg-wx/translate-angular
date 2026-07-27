import { Dictionary, DictionaryEntry } from 'simply-translate';

export interface TestDictionary extends Dictionary {
  hello_user_dynamic: DictionaryEntry;
  same_dyn: DictionaryEntry;
}
