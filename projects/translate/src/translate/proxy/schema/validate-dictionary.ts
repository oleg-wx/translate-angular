import { PlaceholderType } from 'simply-translate';
import { SchemaNode, SchemaShape, TranslateSchemaNode } from './schema.types';

export interface SchemaValidationError {
  path: string[];
  message: string;
}

/**
 * Dotted path (matching `SchemaValidationError.path.join('.')`) -> `true`, or a string documenting why it's allowed.
 */
export type SchemaAllowanceMap = Record<string, true | string>;

export interface ValidateDictionaryOptions {
  /** Schema keys allowed to be missing from the dictionary, e.g. a translation not filled in yet for this language. */
  allowedMissing?: SchemaAllowanceMap;
  /** Dictionary keys allowed to be absent from the schema, e.g. a root-only fallback key. */
  allowedOrphans?: SchemaAllowanceMap;
  /** Placeholder syntax the dictionaries use — must match the `placeholder` passed to `TranslateModule.forRoot`. */
  placeholder?: PlaceholderType;
}

// Mirrors the prefix rules `simply-translate` uses to decide a `{...}` is actually a placeholder (see
// `prepare-regular-expressions-middleware`): 'default' requires a `$`/`&`/`!` right before the brace,
// 'single'/'double' don't. The captured group is always the placeholder's prop name.
const PLACEHOLDER_PATTERNS: Record<PlaceholderType, RegExp> = {
  default: /(?:\$[&!]?|[&!])\{([\w.-]+)(?:\?[^}]*)?\}/g,
  single: /[&!]?\{([\w.-]+)(?:\?[^}]*)?\}/g,
  double: /[&!]?\{\{([\w.-]+)(?:\?[^}]*)?\}\}/g,
};

function findPlaceholders(value: string, pattern: RegExp, found: Set<string>): void {
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    found.add(match[1]);
  }
}

function collectPlaceholders(value: string, pattern: RegExp): Set<string> {
  const found = new Set<string>();
  findPlaceholders(value, pattern, found);
  return found;
}

// `plural`/`cases` maps are keyed by prop name, each holding `[matcher, resultText, testFn?]` options —
// `resultText` (index 1) can itself reference placeholders (including other params), since
// `simply-translate` re-scans a chosen plural/case result for further `{...}` substitutions.
function collectMapPlaceholders(map: Record<string, unknown>, pattern: RegExp, found: Set<string>): void {
  for (const options of Object.values(map)) {
    if (!Array.isArray(options)) continue;
    for (const option of options) {
      if (Array.isArray(option) && typeof option[1] === 'string') {
        findPlaceholders(option[1], pattern, found);
      }
    }
  }
}

function checkParams(found: Set<string>, required: readonly string[] | undefined, path: string[], errors: SchemaValidationError[]): void {
  const requiredSet = new Set(required ?? []);
  for (const name of requiredSet) {
    if (!found.has(name)) {
      errors.push({ path, message: `missing placeholder for param "${name}"` });
    }
  }
  for (const name of found) {
    if (!requiredSet.has(name)) {
      errors.push({ path, message: `unexpected placeholder "${name}", not declared in schema params` });
    }
  }
}

export function validateDictionary(schema: TranslateSchemaNode, data: unknown, options?: ValidateDictionaryOptions): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];
  if (!isPlainObject(data)) {
    return [{ path: [], message: `expected a dictionary object, got ${describe(data)}` }];
  }
  const pattern = PLACEHOLDER_PATTERNS[options?.placeholder ?? 'default'];
  validateShape(schema.shape, data, [], errors, options ?? {}, pattern);
  return errors;
}

export function formatSchemaErrors(errors: SchemaValidationError[]): string {
  return errors.map((e) => `${e.path.join('.') || '<root>'}: ${e.message}`).join('\n');
}

export function assertValidDictionary(schema: TranslateSchemaNode, data: unknown, label?: string, options?: ValidateDictionaryOptions): void {
  const errors = validateDictionary(schema, data, options);
  if (errors.length) {
    const prefix = label ? `Invalid dictionary "${label}":\n` : 'Invalid dictionary:\n';
    throw new Error(prefix + formatSchemaErrors(errors));
  }
}

function validateShape(
  shape: SchemaShape,
  obj: Record<string, unknown>,
  path: string[],
  errors: SchemaValidationError[],
  options: ValidateDictionaryOptions,
  pattern: RegExp,
): void {
  for (const key of Object.keys(shape)) {
    const childPath = [...path, key];
    if (!(key in obj)) {
      if (!isAllowed(options.allowedMissing, childPath)) {
        errors.push({ path: childPath, message: 'missing key' });
      }
      continue;
    }
    validateNode(shape[key], obj[key], childPath, errors, options, pattern);
  }
  for (const key of Object.keys(obj)) {
    if (!(key in shape)) {
      const childPath = [...path, key];
      if (!isAllowed(options.allowedOrphans, childPath)) {
        errors.push({ path: childPath, message: 'unexpected key not declared in schema' });
      }
    }
  }
}

function isAllowed(allowances: SchemaAllowanceMap | undefined, path: string[]): boolean {
  return allowances !== undefined && path.join('.') in allowances;
}

function validateNode(
  node: SchemaNode,
  value: unknown,
  path: string[],
  errors: SchemaValidationError[],
  options: ValidateDictionaryOptions,
  pattern: RegExp,
): void {
  switch (node.kind) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push({ path, message: `expected string, got ${describe(value)}` });
        return;
      }
      checkParams(collectPlaceholders(value, pattern), node.paramNames, path, errors);
      return;
    case 'namespace':
      if (!isPlainObject(value)) {
        errors.push({ path, message: `expected a nested dictionary, got ${describe(value)}` });
        return;
      }
      validateShape(node.shape, value, path, errors, options, pattern);
      return;
    case 'value':
      validateDictionaryValue(value, node.paramNames, pattern, path, errors);
      return;
  }
}

function validateDictionaryValue(
  value: unknown,
  paramNames: readonly string[] | undefined,
  pattern: RegExp,
  path: string[],
  errors: SchemaValidationError[],
): void {
  if (typeof value === 'string') {
    checkParams(collectPlaceholders(value, pattern), paramNames, path, errors);
    return;
  }
  if (isPlainObject(value)) {
    if ('value' in value) {
      validateDictionaryEntry(value, paramNames, pattern, path, errors);
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      validateDictionaryValue(child, paramNames, pattern, [...path, key], errors);
    }
    return;
  }
  errors.push({ path, message: `expected a string, entry, or nested dictionary, got ${describe(value)}` });
}

function validateDictionaryEntry(
  entry: Record<string, unknown>,
  paramNames: readonly string[] | undefined,
  pattern: RegExp,
  path: string[],
  errors: SchemaValidationError[],
): void {
  const found = new Set<string>();

  if (typeof entry['value'] !== 'string') {
    errors.push({ path: [...path, 'value'], message: `expected string, got ${describe(entry['value'])}` });
  } else {
    findPlaceholders(entry['value'], pattern, found);
  }

  if (entry['plural'] !== undefined && !isPlainObject(entry['plural'])) {
    errors.push({ path: [...path, 'plural'], message: `expected a plurals map, got ${describe(entry['plural'])}` });
  } else if (isPlainObject(entry['plural'])) {
    collectMapPlaceholders(entry['plural'], pattern, found);
  }

  if (entry['cases'] !== undefined && !isPlainObject(entry['cases'])) {
    errors.push({ path: [...path, 'cases'], message: `expected a cases map, got ${describe(entry['cases'])}` });
  } else if (isPlainObject(entry['cases'])) {
    collectMapPlaceholders(entry['cases'], pattern, found);
  }

  if (entry['description'] !== undefined && typeof entry['description'] !== 'string') {
    errors.push({ path: [...path, 'description'], message: `expected string, got ${describe(entry['description'])}` });
  }

  checkParams(found, paramNames, path, errors);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
