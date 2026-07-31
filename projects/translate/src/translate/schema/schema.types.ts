export interface BaseNode<TParams extends object | undefined | unknown = undefined> {
  readonly kind: 'string' | 'value' | 'namespace';
  readonly description?: string;
  /** Never actually called — a phantom marker so `TParams` can be recovered later via `extends BaseNode<infer TParams>`. */
  readonly params?: (params: TParams) => void;
}

export interface StringNode<TParams extends object | undefined | unknown = undefined> extends BaseNode<TParams> {
  readonly kind: 'string';
}

export interface ValueNode<TParams extends object | undefined | unknown = undefined> extends BaseNode<TParams> {
  readonly kind: 'value';
}

export interface NamespaceNode<Shape extends SchemaShape = SchemaShape> extends BaseNode<undefined> {
  readonly kind: 'namespace';
  readonly shape: Shape;
}

// `any` here (not `unknown`) is deliberate: `SchemaShape` uses `SchemaNode` as a container type that
// must accept a node with ANY concrete `TParams`, and `params` is a contravariant function-parameter
// position — a node with a specific `TParams` (e.g. `StringNode<{ user: string }>`) is not assignable
// to `StringNode<unknown>`, only to `StringNode<any>`.
export type SchemaNode<TParams = any> = StringNode<TParams> | ValueNode<TParams> | NamespaceNode;

export type SchemaShape = Record<string, SchemaNode>;

export type TranslateSchemaNode<Shape extends SchemaShape = SchemaShape> = NamespaceNode<Shape>;
