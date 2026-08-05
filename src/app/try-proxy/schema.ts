import { Namespace, NumberParam, NumberNullableParam, StringProp, StringParam, TranslateSchema, ValueProp } from 'projects/translate/src/public_api';

export const commonDictionary = TranslateSchema({
  proxy: Namespace({
    welcome_to_app: StringProp(),
    hello_user: StringProp({ params: { user: StringParam } }),

    hello_world: StringProp(),
    goodbye_world: StringProp(),

    namespace: Namespace({
      value: StringProp(),
      hello_user: ValueProp({ params: { user: StringParam } }),
      user: ValueProp(),
    }),

    i_have_been_here_count: ValueProp({ params: { count: NumberNullableParam, days: NumberParam } }),

    day_since_new_year: ValueProp({ params: { days: NumberParam } }),

    for_fallback: ValueProp(),

    same_key: ValueProp(),
  }),
});

export type CommonDictionary = typeof commonDictionary;

export const moreDictionary = TranslateSchema({
  proxy: Namespace({
    more: Namespace({
      more_translate: StringProp(),
    }),
  }),
});

export type MoreDictionary = typeof moreDictionary;
