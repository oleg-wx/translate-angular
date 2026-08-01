import { Namespace, NumberParam, StringProp, StringParam, TranslateSchema, ValueProp } from 'projects/translate/src/public_api';

export const testDictionary = TranslateSchema({
  proxy: Namespace({
    welcome_to_app: StringProp(),
    hello_user: StringProp({ params: { user: StringParam } }),

    hello_world: StringProp(),
    goodbye_world: StringProp(),

    namespace: Namespace({
      value: StringProp(),
      hello_user: ValueProp({params: { user: StringParam }}),
      user: ValueProp(),
    }),

    i_have_been_here_count: ValueProp({params: { count: NumberParam, days: NumberParam }}),

    day_since_new_year: ValueProp({params: { days: 100 }}),

    for_fallback: ValueProp(),

    same_key: ValueProp(),
  }),
});

export type TestDictionary = typeof testDictionary;
