import { Dictionary, DictionaryValue } from 'projects/translate/src/public_api';

export interface TestDictionary extends Dictionary {
  welcome_to_app: DictionaryValue;
  hello_user: DictionaryValue;

  hello_world: DictionaryValue;
  goodbye_world: DictionaryValue;

  namespace: DictionaryValue<{
    value: string;
    hello_user: DictionaryValue;
    user: DictionaryValue;
  }>;

  i_have_been_here_count: DictionaryValue;

  day_since_new_year: DictionaryValue;

  for_fallback: DictionaryValue;

  same_key: DictionaryValue;
}
