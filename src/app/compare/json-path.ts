const IDENTIFIER_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function formatPath(segments: readonly string[]): string {
  let path = '$';
  for (const segment of segments) {
    path += IDENTIFIER_KEY.test(segment) ? `.${segment}` : `[${JSON.stringify(segment)}]`;
  }
  return path;
}
