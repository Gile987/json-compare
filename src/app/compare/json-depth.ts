export const MAX_JSON_DEPTH = 100;
export const JSON_DEPTH_ERROR = `JSON exceeds the maximum nesting depth of ${MAX_JSON_DEPTH} levels.`;

/** Counts objects and arrays, including the root container, as nesting levels. */
export function assertJsonDepth(value: unknown): void {
  visit(value, 0);
}

function visit(value: unknown, depth: number): void {
  if (typeof value !== 'object' || value === null) {
    return;
  }
  if (depth >= MAX_JSON_DEPTH) {
    throw new RangeError(JSON_DEPTH_ERROR);
  }
  for (const child of Object.values(value)) {
    visit(child, depth + 1);
  }
}
