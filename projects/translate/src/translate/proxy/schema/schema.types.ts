import { Dictionary, DictionaryEntry } from "simply-translate";

export interface BaseNode<TParams extends object | undefined | unknown = undefined> {
  readonly kind: 'string' | 'value' | 'namespace';
  readonly description?: string;
  /** Never actually called — a phantom marker so `TParams` can be recovered later via `extends BaseNode<infer TParams>`. */
  readonly params?: (params: TParams) => void;
  /** Runtime witness of `TParams`' keys — generics are erased at runtime, so `validateDictionary` needs this to check placeholder usage. */
  readonly paramNames?: readonly string[];
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

export type DictionaryValue<T = string> = T extends string ? string : T extends Dictionary ? T : DictionaryEntry;

// Sentinels for declaring a param's type when it has no natural default value. Params are kept flat
// (string | number only, no nesting) to match `TranslateDynamicProps` and keep placeholder validation simple.
export const StringParam: unique symbol = Symbol('StringParam');
export const NumberParam: unique symbol = Symbol('NumberParam');
// Nullable variants — same as above, but the param's inferred type also accepts `null`.
export const StringNullableParam: unique symbol = Symbol('StringNullableParam');
export const NumberNullableParam: unique symbol = Symbol('NumberNullableParam');

export type ParamMarker = typeof StringParam | typeof NumberParam | typeof StringNullableParam | typeof NumberNullableParam;

/** A param's declared value: an actual default (`string`/`number`), or a marker when there's no sensible default. */
export type ParamValue = string | number | ParamMarker;

export type Params = Record<string, ParamValue>;

type InferParamValue<V extends ParamValue> = V extends typeof StringParam
  ? string
  : V extends typeof NumberParam
    ? number
    : V extends typeof StringNullableParam
      ? string | null
      : V extends typeof NumberNullableParam
        ? number | null
        : V extends string
          ? string
          : V extends number
            ? number
            : never;

export type InferParams<P extends Params> = { [K in keyof P]: InferParamValue<P[K]> };
