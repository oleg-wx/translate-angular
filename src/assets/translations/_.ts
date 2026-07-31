import { Namespace, String, TranslateSchema, Value } from 'projects/translate/src/public_api';

export const testDictionary = TranslateSchema({
  welcome_to_app: String(),
  hello_user: String(),

  hello_world: String(),
  goodbye_world: String(),

  namespace: Namespace({
    value: String(),
    hello_user: Value(),
    user: Value(),
  }),

  i_have_been_here_count: Value(),

  day_since_new_year: Value(),

  for_fallback: Value(),

  same_key: Value(),
});
