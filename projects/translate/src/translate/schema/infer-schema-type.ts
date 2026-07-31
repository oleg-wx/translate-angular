import { Dictionary } from 'simply-translate';
import { DictionaryValue } from '../translate.proxy';
import { NamespaceNode, SchemaNode, SchemaShape, TranslateSchemaNode } from './schema.types';

type InferNode<Node extends SchemaNode> = Node extends { kind: 'string' }
  ? string
  : Node extends NamespaceNode<infer Shape>
    ? DictionaryValue<InferShape<Shape>>
    : Node extends { kind: 'value' }
      ? DictionaryValue
      : never;

type InferShape<Shape extends SchemaShape> = {
  [K in keyof Shape]: InferNode<Shape[K]>;
};

export type InferTranslateSchemaType<S extends TranslateSchemaNode> = InferShape<S['shape']> & Dictionary;
