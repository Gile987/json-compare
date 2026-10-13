import { jsonTypeOf, type JsonType, type JsonValue } from './json-value';
import { formatPath } from './json-path';
import { assertJsonDepth } from './json-depth';

export interface AddedDifference {
  readonly kind: 'added';
  readonly path: string;
  readonly updatedType: JsonType;
}

export interface RemovedDifference {
  readonly kind: 'removed';
  readonly path: string;
  readonly baselineType: JsonType;
}

export interface TypeChangedDifference {
  readonly kind: 'type-changed';
  readonly path: string;
  readonly baselineType: JsonType;
  readonly updatedType: JsonType;
}

export type Difference = AddedDifference | RemovedDifference | TypeChangedDifference;

export function compareJson(baseline: JsonValue, updated: JsonValue): readonly Difference[] {
  assertJsonDepth(baseline);
  assertJsonDepth(updated);
  const differences: Difference[] = [];
  visit([], baseline, updated, differences);
  return differences;
}

function visit(
  segments: readonly string[],
  baseline: JsonValue,
  updated: JsonValue,
  differences: Difference[],
): void {
  const baselineType = jsonTypeOf(baseline);
  const updatedType = jsonTypeOf(updated);
  if (baselineType !== updatedType) {
    differences.push({
      kind: 'type-changed',
      path: formatPath(segments),
      baselineType,
      updatedType,
    });
    return;
  }
  if (!isJsonObject(baseline) || !isJsonObject(updated)) {
    return;
  }
  const keys = [...new Set([...Object.keys(baseline), ...Object.keys(updated)])].sort();
  for (const key of keys) {
    const inBaseline = Object.hasOwn(baseline, key);
    const inUpdated = Object.hasOwn(updated, key);
    const childPath = formatPath([...segments, key]);
    if (inBaseline && inUpdated) {
      visit([...segments, key], baseline[key], updated[key], differences);
    } else if (inUpdated) {
      differences.push({ kind: 'added', path: childPath, updatedType: jsonTypeOf(updated[key]) });
    } else {
      differences.push({
        kind: 'removed',
        path: childPath,
        baselineType: jsonTypeOf(baseline[key]),
      });
    }
  }
}

function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
