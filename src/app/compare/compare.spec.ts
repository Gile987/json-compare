import { compareJson, Difference } from './compare';
import { JsonValue, parseJson } from './json-value';
import { EXAMPLE_BASELINE, EXAMPLE_UPDATED } from './sample-data';

function parse(text: string): JsonValue {
  const result = parseJson(text);
  if (!result.ok) {
    throw new Error(`Test fixture is not valid JSON: ${result.message}`);
  }
  return result.value;
}

function deepFreeze(value: unknown): void {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
}

describe('compareJson', () => {
  it('returns no changes for identical responses', () => {
    expect(compareJson(parse('{"a": 1, "b": [1, 2]}'), parse('{"a": 1, "b": [1, 2]}'))).toEqual([]);
  });

  it('returns no changes for reordered object keys', () => {
    expect(compareJson(parse('{"a": 1, "b": 2}'), parse('{"b": 2, "a": 1}'))).toEqual([]);
  });

  it('returns no changes for different primitive values of the same type', () => {
    expect(compareJson(parse('{"a": 1, "b": "x", "c": true}'), parse('{"a": 2, "b": "y", "c": false}'))).toEqual([]);
  });

  it('reports nested additions, removals, and type changes with paths and types', () => {
    const baseline = parse('{"keep": 1, "drop": {"x": 1}, "shift": {"y": 2}}');
    const updated = parse('{"keep": 1, "shift": [1], "new": "yes"}');
    expect(compareJson(baseline, updated)).toEqual([
      { kind: 'removed', path: '$.drop', baselineType: 'object' },
      { kind: 'added', path: '$.new', updatedType: 'string' },
      { kind: 'type-changed', path: '$.shift', baselineType: 'object', updatedType: 'array' },
    ] satisfies readonly Difference[]);
  });

  it('emits a single row for an added object without descendant rows', () => {
    const result = compareJson(parse('{}'), parse('{"a": {"b": {"c": 1}}}'));
    expect(result).toEqual([{ kind: 'added', path: '$.a', updatedType: 'object' }]);
  });

  it('emits a single row for a removed object without descendant rows', () => {
    const result = compareJson(parse('{"a": {"b": {"c": 1}}}'), parse('{}'));
    expect(result).toEqual([{ kind: 'removed', path: '$.a', baselineType: 'object' }]);
  });

  it('stops descending after a type change', () => {
    const result = compareJson(parse('{"a": {"x": 1, "y": 2}}'), parse('{"a": "text"}'));
    expect(result).toEqual([
      { kind: 'type-changed', path: '$.a', baselineType: 'object', updatedType: 'string' },
    ]);
  });

  it('distinguishes missing from null', () => {
    expect(compareJson(parse('{"a": null}'), parse('{}'))).toEqual([
      { kind: 'removed', path: '$.a', baselineType: 'null' },
    ]);
    expect(compareJson(parse('{}'), parse('{"a": null}'))).toEqual([
      { kind: 'added', path: '$.a', updatedType: 'null' },
    ]);
  });

  it('treats null and object as different types', () => {
    expect(compareJson(parse('{"a": {"b": 1}}'), parse('{"a": null}'))).toEqual([
      { kind: 'type-changed', path: '$.a', baselineType: 'object', updatedType: 'null' },
    ]);
  });

  it('ignores arrays with different contents, lengths, or item types', () => {
    expect(compareJson(parse('{"a": [1, 2]}'), parse('{"a": [1]}'))).toEqual([]);
    expect(compareJson(parse('{"a": [1, "x"]}'), parse('{"a": [null, null, null]}'))).toEqual([]);
    expect(compareJson(parse('[]'), parse('[{"any": "thing"}]'))).toEqual([]);
  });

  it('detects an array changing to an object', () => {
    expect(compareJson(parse('{"a": []}'), parse('{"a": {}}'))).toEqual([
      { kind: 'type-changed', path: '$.a', baselineType: 'array', updatedType: 'object' },
    ]);
  });

  it('detects root-level type changes', () => {
    expect(compareJson(parse('[1]'), parse('{"a": 1}'))).toEqual([
      { kind: 'type-changed', path: '$', baselineType: 'array', updatedType: 'object' },
    ]);
    expect(compareJson(parse('"1"'), parse('1'))).toEqual([
      { kind: 'type-changed', path: '$', baselineType: 'string', updatedType: 'number' },
    ]);
  });

  it('supports primitive and null roots', () => {
    expect(compareJson(parse('1'), parse('2'))).toEqual([]);
    expect(compareJson(parse('null'), parse('null'))).toEqual([]);
    expect(compareJson(parse('null'), parse('{}'))).toEqual([
      { kind: 'type-changed', path: '$', baselineType: 'null', updatedType: 'object' },
    ]);
    expect(compareJson(parse('true'), parse('false'))).toEqual([]);
  });

  it('produces unambiguous paths for unusual keys', () => {
    const baseline = parse('{"display.name": {"a": 1}, "": 1, "a\\"b": true}');
    const updated = parse('{"display.name": {}, "": "text", "a\\"b": true}');
    expect(compareJson(baseline, updated)).toEqual([
      { kind: 'type-changed', path: '$[""]', baselineType: 'number', updatedType: 'string' },
      { kind: 'removed', path: '$["display.name"].a', baselineType: 'number' },
    ]);
  });

  it('compares special own keys such as __proto__ correctly', () => {
    const withProto = parse('{"__proto__": {"a": 1}}');
    expect(compareJson(withProto, parse('{}'))).toEqual([
      { kind: 'removed', path: '$.__proto__', baselineType: 'object' },
    ]);
    expect(compareJson(parse('{}'), withProto)).toEqual([
      { kind: 'added', path: '$.__proto__', updatedType: 'object' },
    ]);
    expect(compareJson(parse('{"__proto__": 1}'), parse('{"__proto__": "x"}'))).toEqual([
      { kind: 'type-changed', path: '$.__proto__', baselineType: 'number', updatedType: 'string' },
    ]);
  });

  it('compares constructor and hasOwnProperty as ordinary keys', () => {
    expect(compareJson(parse('{"constructor": 1}'), parse('{}'))).toEqual([
      { kind: 'removed', path: '$.constructor', baselineType: 'number' },
    ]);
    expect(compareJson(parse('{}'), parse('{"hasOwnProperty": "x"}'))).toEqual([
      { kind: 'added', path: '$.hasOwnProperty', updatedType: 'string' },
    ]);
  });

  it('does not mutate either input', () => {
    const baseline = parse('{"a": {"b": [1, {"c": 2}]}, "d": null}');
    const updated = parse('{"a": {"b": [3], "e": 4}}');
    deepFreeze(baseline);
    deepFreeze(updated);
    expect(() => compareJson(baseline, updated)).not.toThrow();
    expect(compareJson(baseline, updated)).toEqual([
      { kind: 'added', path: '$.a.e', updatedType: 'number' },
      { kind: 'removed', path: '$.d', baselineType: 'null' },
    ]);
  });

  it('returns results in deterministic order regardless of key insertion order', () => {
    const first = compareJson(
      parse('{"b": 1, "a": 1, "c": {"y": 1, "x": 1}}'),
      parse('{"a": 1, "c": {"x": 1}, "d": 1}'),
    );
    const second = compareJson(
      parse('{"c": {"x": 1, "y": 1}, "a": 1, "b": 1}'),
      parse('{"d": 1, "c": {"x": 1}, "a": 1}'),
    );
    expect(first).toEqual(second);
    expect(first.map((difference) => difference.path)).toEqual([
      '$.b',
      '$.c.y',
      '$.d',
    ]);
  });

  it('yields exactly the five expected rows for the documented example', () => {
    const result = compareJson(parse(EXAMPLE_BASELINE), parse(EXAMPLE_UPDATED));
    expect(result).toEqual([
      { kind: 'added', path: '$.permissions', updatedType: 'array' },
      { kind: 'type-changed', path: '$.price', baselineType: 'number', updatedType: 'string' },
      { kind: 'type-changed', path: '$.user.address', baselineType: 'object', updatedType: 'null' },
      { kind: 'added', path: '$.user.displayName', updatedType: 'string' },
      { kind: 'removed', path: '$.user.name', baselineType: 'string' },
    ] satisfies readonly Difference[]);
  });
});
