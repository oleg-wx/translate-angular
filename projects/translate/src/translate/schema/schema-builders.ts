import { NamespaceNode, SchemaShape, StringNode, TranslateSchemaNode, ValueNode } from './schema.types';

export function String(): StringNode {
  return { kind: 'string' };
}

export function Value(): ValueNode {
  return { kind: 'value' };
}

export function Namespace<Shape extends SchemaShape>(shape: Shape): NamespaceNode<Shape> {
  return { kind: 'namespace', shape };
}

export function TranslateSchema<Shape extends SchemaShape>(shape: Shape): TranslateSchemaNode<Shape> {
  return { kind: 'namespace', shape };
}
