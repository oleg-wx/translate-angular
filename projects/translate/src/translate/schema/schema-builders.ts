import { NamespaceNode, SchemaShape, StringNode, TranslateSchemaNode, ValueNode } from './schema.types';

// Overloaded rather than a single `<TParams = undefined>` signature: when this is called bare, as an
// argument inside `Namespace({...})`/`TranslateSchema({...})`, TypeScript uses that call's expected
// contextual type (`SchemaNode`) to help infer TParams — which silently overrides a *default* type
// parameter with whatever `SchemaNode`'s own default is, discarding `undefined`. A non-generic overload
// for the zero-argument call has no generic parameter for that contextual type to hijack.
export function String(options?: { description?: string }): StringNode<undefined>;
export function String<TParams extends object>(options?: { description?: string }): StringNode<TParams>;
export function String<TParams extends object | undefined = undefined>(options?: { description?: string }): StringNode<TParams> {
  return { kind: 'string', description: options?.description, params: (_: TParams) => {} };
}

export function Value(options?: { description?: string }): ValueNode<undefined>;
export function Value<TParams extends object>(options?: { description?: string }): ValueNode<TParams>;
export function Value<TParams extends object | undefined = undefined>(options?: { description?: string }): ValueNode<TParams> {
  return { kind: 'value', description: options?.description, params: (_: TParams) => {} };
}

export function Namespace<Shape extends SchemaShape>(shape: Shape, options?: { description?: string }): NamespaceNode<Shape> {
  return { kind: 'namespace', shape, description: options?.description };
}

export function TranslateSchema<Shape extends SchemaShape>(shape: Shape): TranslateSchemaNode<Shape> {
  return { kind: 'namespace', shape };
}
