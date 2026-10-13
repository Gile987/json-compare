import { assertJsonDepth, MAX_JSON_DEPTH } from './json-depth';

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type JsonType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export type ParseResult = { ok: true; value: JsonValue } | { ok: false; message: string };

export function jsonTypeOf(value: JsonValue): JsonType {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'object';
  }
}

export function isJsonValue(value: unknown): value is JsonValue {
  return isJsonValueAtDepth(value, 0);
}

function isJsonValueAtDepth(value: unknown, depth: number): value is JsonValue {
  if (value === null) {
    return true;
  }
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return true;
    case 'number':
      return Number.isFinite(value);
    case 'object': {
      if (depth >= MAX_JSON_DEPTH) {
        return false;
      }
      if (Array.isArray(value)) {
        return value.every((child) => isJsonValueAtDepth(child, depth + 1));
      }
      const prototype: unknown = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) {
        return false;
      }
      return Object.values(value).every((child) => isJsonValueAtDepth(child, depth + 1));
    }
    default:
      return false;
  }
}

export function parseJson(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
    assertJsonDepth(parsed);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Invalid JSON.' };
  }
  if (isJsonValue(parsed)) {
    return { ok: true, value: parsed };
  }
  return { ok: false, message: 'Input is not a valid JSON value.' };
}
