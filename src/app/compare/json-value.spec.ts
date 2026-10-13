import { isJsonValue, jsonTypeOf, parseJson } from './json-value';
import { JSON_DEPTH_ERROR, MAX_JSON_DEPTH } from './json-depth';

function nestedJson(depth: number, containers: 'objects' | 'arrays' | 'mixed'): string {
  let text = '0';
  for (let level = 0; level < depth; level++) {
    const useArray = containers === 'arrays' || (containers === 'mixed' && level % 2 === 0);
    text = useArray ? `[${text}]` : `{"child":${text}}`;
  }
  return text;
}

describe('jsonTypeOf', () => {
  it('detects null before treating it as an object', () => {
    expect(jsonTypeOf(null)).toBe('null');
  });

  it('detects arrays before treating them as objects', () => {
    expect(jsonTypeOf([])).toBe('array');
    expect(jsonTypeOf([1, 'two', null])).toBe('array');
  });

  it('detects plain objects', () => {
    expect(jsonTypeOf({})).toBe('object');
    expect(jsonTypeOf({ a: 1 })).toBe('object');
  });

  it('detects primitives', () => {
    expect(jsonTypeOf('text')).toBe('string');
    expect(jsonTypeOf(true)).toBe('boolean');
  });

  it('treats integers and decimals as number', () => {
    expect(jsonTypeOf(42)).toBe('number');
    expect(jsonTypeOf(99.99)).toBe('number');
    expect(jsonTypeOf(-0)).toBe('number');
  });
});

describe('isJsonValue', () => {
  it.each(['objects', 'arrays', 'mixed'] as const)(
    'accepts %s at the nesting limit and rejects deeper values without throwing',
    (containers) => {
      const atLimit: unknown = JSON.parse(nestedJson(MAX_JSON_DEPTH, containers));
      const tooDeep: unknown = JSON.parse(nestedJson(10_000, containers));
      expect(isJsonValue(atLimit)).toBe(true);
      expect(isJsonValue(tooDeep)).toBe(false);
    },
  );

  it('accepts every JSON value kind', () => {
    expect(isJsonValue(null)).toBe(true);
    expect(isJsonValue(true)).toBe(true);
    expect(isJsonValue(1.5)).toBe(true);
    expect(isJsonValue('x')).toBe(true);
    expect(isJsonValue([1, { a: [null] }])).toBe(true);
    expect(isJsonValue({ a: { b: [{ c: 'd' }] } })).toBe(true);
  });

  it('rejects non-finite numbers', () => {
    expect(isJsonValue(Number.NaN)).toBe(false);
    expect(isJsonValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isJsonValue({ a: Number.NEGATIVE_INFINITY })).toBe(false);
  });

  it('rejects undefined, functions, and symbols', () => {
    expect(isJsonValue(undefined)).toBe(false);
    expect(isJsonValue(() => 1)).toBe(false);
    expect(isJsonValue(Symbol('s'))).toBe(false);
    expect(isJsonValue({ a: undefined })).toBe(false);
  });

  it('rejects values with a non-plain prototype', () => {
    expect(isJsonValue(new Date())).toBe(false);
    expect(isJsonValue(new Map())).toBe(false);
  });

  it('accepts objects with a null prototype', () => {
    const value = Object.assign(Object.create(null) as object, { a: 1 });
    expect(isJsonValue(value)).toBe(true);
  });
});

describe('parseJson', () => {
  it.each(['objects', 'arrays', 'mixed'] as const)(
    'accepts %s at the nesting limit',
    (containers) => {
      expect(parseJson(nestedJson(MAX_JSON_DEPTH, containers)).ok).toBe(true);
    },
  );

  it.each(['objects', 'arrays', 'mixed'] as const)(
    'returns a useful error for %s one level beyond the limit',
    (containers) => {
      expect(parseJson(nestedJson(MAX_JSON_DEPTH + 1, containers))).toEqual({
        ok: false,
        message: JSON_DEPTH_ERROR,
      });
    },
  );

  it.each(['objects', 'arrays', 'mixed'] as const)(
    'returns an error instead of overflowing the stack for 10,000 nested %s',
    (containers) => {
      expect(parseJson(nestedJson(10_000, containers))).toEqual({
        ok: false,
        message: JSON_DEPTH_ERROR,
      });
    },
  );

  it('counts empty objects and arrays as nesting levels', () => {
    for (const leaf of ['{}', '[]']) {
      const atLimit = '['.repeat(MAX_JSON_DEPTH - 1) + leaf + ']'.repeat(MAX_JSON_DEPTH - 1);
      const tooDeep = '['.repeat(MAX_JSON_DEPTH) + leaf + ']'.repeat(MAX_JSON_DEPTH);
      expect(parseJson(atLimit).ok).toBe(true);
      expect(parseJson(tooDeep)).toEqual({ ok: false, message: JSON_DEPTH_ERROR });
    }
  });

  it('accepts every valid JSON root type', () => {
    const cases: readonly string[] = ['{}', '[]', '"text"', '42', '4.2', 'true', 'false', 'null'];
    for (const text of cases) {
      const result = parseJson(text);
      expect(result.ok).toBe(true);
    }
  });

  it('parses nested structures into JsonValue', () => {
    const result = parseJson('{"a": [1, "two", null]}');
    expect(result).toEqual({ ok: true, value: { a: [1, 'two', null] } });
  });

  it('returns an error without throwing for invalid JSON', () => {
    const result = parseJson('{invalid');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it('returns an error for empty input', () => {
    expect(parseJson('').ok).toBe(false);
    expect(parseJson('   ').ok).toBe(false);
  });
});
