export interface StringNode {
  readonly kind: 'string';
}

export interface ValueNode {
  readonly kind: 'value';
}

export interface NamespaceNode<Shape extends SchemaShape = SchemaShape> {
  readonly kind: 'namespace';
  readonly shape: Shape;
}

export type SchemaNode = StringNode | ValueNode | NamespaceNode;

export type SchemaShape = Record<string, SchemaNode>;

export type TranslateSchemaNode<Shape extends SchemaShape = SchemaShape> = NamespaceNode<Shape>;
