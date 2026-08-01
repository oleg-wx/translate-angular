import { Dictionary } from 'simply-translate';
import { InferTranslateSchemaType, Namespace, NumberParam, StringProp, StringParam, TranslateSchema, ValueProp, validateDictionary } from '../translate/proxy/schema';

const testSchema = TranslateSchema({
  welcome_to_app: StringProp(),
  hello_user: StringProp({ params: { user: StringParam } }),

  hello_world: ValueProp(),
  goodbye_world: ValueProp(),

  namespace: Namespace({
    value: StringProp(),
    hello_user: ValueProp({ params: { user: StringParam } }),
    user: ValueProp(),
  }),

  i_have_been_here_count: ValueProp({ params: { count: NumberParam, days: NumberParam } }),
  day_since_new_year: ValueProp({ params: { days: NumberParam } }),
  for_fallback: ValueProp(),
  same_key: ValueProp(),
});

type TestDictionary = InferTranslateSchemaType<typeof testSchema>;

// Compile-time check: the inferred type must satisfy `Dictionary`, just like a hand-written interface.
function expectsDictionary(_dictionary: Dictionary): void {}
expectsDictionary({} as TestDictionary);

const validDictionary = {
  welcome_to_app: 'Welcome to Translation Testing Application',
  hello_user: 'Hello ${user}!',

  hello_world: 'Hello World',
  goodbye_world: {
    value: 'Goodbye World',
    description: 'When you want to say goodbye to the world',
  },

  namespace: {
    value: 'Namespace translated',
    hello_user: 'Hello again, ${user}!',
    user: 'User',
  },

  i_have_been_here_count: {
    value: '${count} ${days}',
    cases: { count: [['!!', 'value']] },
    plural: { count: [['=0', 'value']], days: [['=0', 'value']] },
  },
  day_since_new_year: { value: '${days}', plural: { days: [['=1', 'value']] } },
  for_fallback: 'Fallback',
  same_key: 'Same in the Root',
};

describe('schema', () => {
  it('accepts a dictionary that matches the schema', () => {
    expect(validateDictionary(testSchema, validDictionary)).toEqual([]);
  });

  it('reports a missing key', () => {
    const { welcome_to_app, ...rest } = validDictionary;
    expect(validateDictionary(testSchema, rest)).toEqual([{ path: ['welcome_to_app'], message: 'missing key' }]);
  });

  it('reports an unexpected key not declared in the schema', () => {
    const errors = validateDictionary(testSchema, { ...validDictionary, only_root_key: 'Only in the Root' });
    expect(errors).toEqual([{ path: ['only_root_key'], message: 'unexpected key not declared in schema' }]);
  });

  it('does not report a missing key allowed via allowedMissing', () => {
    const { welcome_to_app, ...rest } = validDictionary;
    expect(validateDictionary(testSchema, rest, { allowedMissing: { welcome_to_app: 'not translated yet' } })).toEqual([]);
  });

  it('does not report an orphan key allowed via allowedOrphans', () => {
    const errors = validateDictionary(testSchema, { ...validDictionary, only_root_key: 'Only in the Root' }, { allowedOrphans: { only_root_key: true } });
    expect(errors).toEqual([]);
  });

  it('matches allowedMissing/allowedOrphans on the full dotted path, not just the leaf key', () => {
    const { namespace, ...rest } = validDictionary;
    const errors = validateDictionary(
      testSchema,
      { ...rest, namespace: { value: namespace.value, hello_user: namespace.hello_user } },
      { allowedMissing: { user: true } },
    );
    expect(errors).toEqual([{ path: ['namespace', 'user'], message: 'missing key' }]);
  });

  it('reports a wrong type on a strict string leaf', () => {
    const errors = validateDictionary(testSchema, { ...validDictionary, welcome_to_app: 42 });
    expect(errors).toEqual([{ path: ['welcome_to_app'], message: 'expected string, got number' }]);
  });

  it('reports a wrong type on a value leaf', () => {
    const errors = validateDictionary(testSchema, { ...validDictionary, hello_world: 42 });
    expect(errors).toEqual([{ path: ['hello_world'], message: 'expected a string, entry, or nested dictionary, got number' }]);
  });

  it('validates entry shape on a value leaf (value/description/plural/cases)', () => {
    const errors = validateDictionary(testSchema, {
      ...validDictionary,
      goodbye_world: { value: 42, description: 7, plural: 'nope', cases: 'nope' },
    });
    expect(errors).toEqual([
      { path: ['goodbye_world', 'value'], message: 'expected string, got number' },
      { path: ['goodbye_world', 'plural'], message: 'expected a plurals map, got string' },
      { path: ['goodbye_world', 'cases'], message: 'expected a cases map, got string' },
      { path: ['goodbye_world', 'description'], message: 'expected string, got number' },
    ]);
  });

  it('recurses into a namespace and reports nested errors with a full path', () => {
    const errors = validateDictionary(testSchema, {
      ...validDictionary,
      namespace: { value: 'Namespace translated', hello_user: 'Hello again, ${user}!' },
    });
    expect(errors).toEqual([{ path: ['namespace', 'user'], message: 'missing key' }]);
  });

  it('rejects a non-object dictionary', () => {
    expect(validateDictionary(testSchema, null)).toEqual([{ path: [], message: 'expected a dictionary object, got null' }]);
    expect(validateDictionary(testSchema, 'nope')).toEqual([{ path: [], message: 'expected a dictionary object, got string' }]);
  });

  it('reports a missing placeholder for a declared param', () => {
    const errors = validateDictionary(testSchema, { ...validDictionary, hello_user: 'Hello there' });
    expect(errors).toEqual([{ path: ['hello_user'], message: 'missing placeholder for param "user"' }]);
  });

  it('reports an unexpected placeholder when the node declares no params', () => {
    const errors = validateDictionary(testSchema, { ...validDictionary, welcome_to_app: 'Welcome, ${name}!' });
    expect(errors).toEqual([{ path: ['welcome_to_app'], message: 'unexpected placeholder "name", not declared in schema params' }]);
  });

  it('accepts a required placeholder that only appears inside a plural/cases result string', () => {
    const errors = validateDictionary(testSchema, {
      ...validDictionary,
      day_since_new_year: { value: 'x', plural: { count: [['=1', 'Just ${days} day']] } },
    });
    expect(errors).toEqual([]);
  });

  it('supports the "single" placeholder syntax via the `placeholder` option', () => {
    const singleSchema = TranslateSchema({ greeting: StringProp({ params: { user: StringParam } }) });
    expect(validateDictionary(singleSchema, { greeting: 'Hello {user}!' }, { placeholder: 'single' })).toEqual([]);
    expect(validateDictionary(singleSchema, { greeting: 'Hello {user}!' })).toEqual([
      { path: ['greeting'], message: 'missing placeholder for param "user"' },
    ]);
  });
});
