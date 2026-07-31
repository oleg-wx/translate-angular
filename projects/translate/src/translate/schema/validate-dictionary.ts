import { SchemaNode, SchemaShape, TranslateSchemaNode } from './schema.types';

export interface SchemaValidationError {
  path: string[];
  message: string;
}

export function validateDictionary(schema: TranslateSchemaNode, data: unknown): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];
  if (!isPlainObject(data)) {
    return [{ path: [], message: `expected a dictionary object, got ${describe(data)}` }];
  }
  validateShape(schema.shape, data, [], errors);
  return errors;
}

export function formatSchemaErrors(errors: SchemaValidationError[]): string {
  return errors.map((e) => `${e.path.join('.') || '<root>'}: ${e.message}`).join('\n');
}

export function assertValidDictionary(schema: TranslateSchemaNode, data: unknown, label?: string): void {
  const errors = validateDictionary(schema, data);
  if (errors.length) {
    const prefix = label ? `Invalid dictionary "${label}":\n` : 'Invalid dictionary:\n';
    throw new Error(prefix + formatSchemaErrors(errors));
  }
}

function validateShape(shape: SchemaShape, obj: Record<string, unknown>, path: string[], errors: SchemaValidationError[]): void {
  for (const key of Object.keys(shape)) {
    const childPath = [...path, key];
    if (!(key in obj)) {
      errors.push({ path: childPath, message: 'missing key' });
      continue;
    }
    validateNode(shape[key], obj[key], childPath, errors);
  }
  for (const key of Object.keys(obj)) {
    if (!(key in shape)) {
      errors.push({ path: [...path, key], message: 'unexpected key not declared in schema' });
    }
  }
}

function validateNode(node: SchemaNode, value: unknown, path: string[], errors: SchemaValidationError[]): void {
  switch (node.kind) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push({ path, message: `expected string, got ${describe(value)}` });
      }
      return;
    case 'namespace':
      if (!isPlainObject(value)) {
        errors.push({ path, message: `expected a nested dictionary, got ${describe(value)}` });
        return;
      }
      validateShape(node.shape, value, path, errors);
      return;
    case 'value':
      validateDictionaryValue(value, path, errors);
      return;
  }
}

function validateDictionaryValue(value: unknown, path: string[], errors: SchemaValidationError[]): void {
  if (typeof value === 'string') {
    return;
  }
  if (isPlainObject(value)) {
    if ('value' in value) {
      validateDictionaryEntry(value, path, errors);
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      validateDictionaryValue(child, [...path, key], errors);
    }
    return;
  }
  errors.push({ path, message: `expected a string, entry, or nested dictionary, got ${describe(value)}` });
}

function validateDictionaryEntry(entry: Record<string, unknown>, path: string[], errors: SchemaValidationError[]): void {
  if (typeof entry['value'] !== 'string') {
    errors.push({ path: [...path, 'value'], message: `expected string, got ${describe(entry['value'])}` });
  }
  if (entry['plural'] !== undefined && !isPlainObject(entry['plural'])) {
    errors.push({ path: [...path, 'plural'], message: `expected a plurals map, got ${describe(entry['plural'])}` });
  }
  if (entry['cases'] !== undefined && !isPlainObject(entry['cases'])) {
    errors.push({ path: [...path, 'cases'], message: `expected a cases map, got ${describe(entry['cases'])}` });
  }
  if (entry['description'] !== undefined && typeof entry['description'] !== 'string') {
    errors.push({ path: [...path, 'description'], message: `expected string, got ${describe(entry['description'])}` });
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
