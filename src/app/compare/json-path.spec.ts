import { formatPath } from './json-path';

describe('formatPath', () => {
  it('formats the root as $', () => {
    expect(formatPath([])).toBe('$');
  });

  it('uses dot notation for identifier-like keys', () => {
    expect(formatPath(['user', 'name'])).toBe('$.user.name');
  });

  it('accepts $ and _ in identifier-like keys', () => {
    expect(formatPath(['$schema', '_private', 'a1'])).toBe('$.$schema._private.a1');
  });

  it('uses bracket notation for keys containing a dot', () => {
    expect(formatPath(['display.name'])).toBe('$["display.name"]');
  });

  it('uses bracket notation for the empty key', () => {
    expect(formatPath([''])).toBe('$[""]');
  });

  it('uses bracket notation for keys starting with a digit', () => {
    expect(formatPath(['1st'])).toBe('$["1st"]');
  });

  it('uses bracket notation for keys with spaces', () => {
    expect(formatPath(['display name'])).toBe('$["display name"]');
  });

  it('JSON-escapes quotes and backslashes inside brackets', () => {
    expect(formatPath(['a"b'])).toBe('$["a\\"b"]');
    expect(formatPath(['a\\b'])).toBe('$["a\\\\b"]');
  });

  it('keeps a dotted key distinguishable from nesting', () => {
    const nested = formatPath(['display', 'name']);
    const literal = formatPath(['display.name']);
    expect(nested).not.toBe(literal);
  });

  it('formats control characters with JSON escapes', () => {
    expect(formatPath(['a\nb'])).toBe('$["a\\nb"]');
  });
});
