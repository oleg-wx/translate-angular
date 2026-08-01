import { Namespace, String, TranslateSchema, Value } from 'projects/translate/src/public_api';

export const testDictionary = TranslateSchema({
  proxy: Namespace({
    welcome_to_app: String(),
    hello_user: String<{ user?: string }>(),

    hello_world: String(),
    goodbye_world: String(),

    namespace: Namespace({
      value: String(),
      hello_user: Value<{ user?: string }>(),
      user: Value(),
    }),

    i_have_been_here_count: Value<{ count: number; days: number }>(),

    day_since_new_year: Value<{ days: number }>(),

    for_fallback: Value(),

    same_key: Value(),
  }),
});

export type TestDictionary = typeof testDictionary;
