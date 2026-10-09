import { InferParams, NamespaceNode, Params, SchemaShape, StringNode, TranslateSchemaNode, ValueNode } from './schema.types';

// Overloaded rather than a single `<TParams = undefined>` signature: when this is called bare, as an
// argument inside `Namespace({...})`/`TranslateSchema({...})`, TypeScript uses that call's expected
// contextual type (`SchemaNode`) to help infer TParams — which silently overrides a *default* type
// parameter with whatever `SchemaNode`'s own default is, discarding `undefined`. A non-generic overload
// for the zero-argument call has no generic parameter for that contextual type to hijack.
// `TParams` is inferred from `params` itself (an example value per key, or `StringParam`/`NumberParam`
// when there's no natural default) rather than passed explicitly — generics are erased at runtime, so
// without this witness `validateDictionary` would have no way to know which placeholders a translation
// is supposed to contain, and declaring the shape twice (as a type argument AND at runtime) would be redundant.
export function StringProp(options?: { description?: string }): StringNode<undefined>;
export function StringProp<P extends Params>(options: { description?: string; params: P }): StringNode<InferParams<P>>;
export function StringProp(options?: { description?: string; params?: Params }): StringNode<any> {
  return {
    kind: 'string',
    description: options?.description,
    paramNames: options?.params ? Object.keys(options.params) : undefined,
  };
}

export function ValueProp(options?: { description?: string }): ValueNode<undefined>;
export function ValueProp<P extends Params>(options: { description?: string; params: P }): ValueNode<InferParams<P>>;
export function ValueProp(options?: { description?: string; params?: Params }): ValueNode<any> {
  return {
    kind: 'value',
    description: options?.description,
    paramNames: options?.params ? Object.keys(options.params) : undefined,
  };
}

export function Namespace<Shape extends SchemaShape>(shape: Shape, options?: { description?: string }): NamespaceNode<Shape> {
  return { kind: 'namespace', shape, description: options?.description };
}

export function TranslateSchema<Shape extends SchemaShape>(shape: Shape): TranslateSchemaNode<Shape> {
  return { kind: 'namespace', shape };
}
