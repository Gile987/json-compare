# API Response Drift Detector

Compare two pasted JSON responses and report structural differences that might affect a frontend
consumer. Changes to primitive values are ignored when their types stay the same.

Everything runs in browser memory: no backend, no storage, no network calls.

## Setup

Requires Node.js `^22.22.3`, `^24.15.0`, or `^26.0.0` and npm.

```sh
npm install
npm start
```

Then open http://localhost:4200.

## Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Dev server with live reload |
| `npm run build` | Production build into `dist/` |
| `npm test` | Unit tests (Vitest, single run in CI: `CI=true npm test`) |

## Behavior

Paste a baseline response on the left and an updated response on the right, then choose
**Compare**. **Load example** fills both editors with a built-in sample; **Clear** resets the page.

The comparison reports three kinds of structural differences:

| Change | Meaning |
| --- | --- |
| Added | Key exists only in the updated object |
| Removed | Key exists only in the baseline object |
| Type changed | Same path, different JSON type (object, array, string, number, boolean, null) |

Rules of the engine:

- Objects are compared recursively by own keys; key order does not matter and matching is
  case-sensitive. An added or removed object produces one row, not one row per descendant.
- A type change stops traversal below that path.
- **Arrays are compared by type only; their items are not inspected.** Differences in array
  contents, length, or item types produce no results. An array becoming a non-array (or the
  reverse) is still a type change.
- Primitive values of the same type are never reported, regardless of their values.
- Missing and null are distinct; null and object are different types.
- Any valid JSON root is accepted, including arrays, primitives, and null.
- Editing either editor clears previous results and errors, so stale comparisons are never
  shown as current.

Paths start at `$` and use dot notation for identifier-like keys (`$.user.name`) and brackets
with a JSON-escaped string for everything else (`$["display.name"]`, `$[""]`), so unusual keys
stay unambiguous.

## Sample comparison vs. schema validation

This tool compares two response **samples**, not API schemas. It cannot prove compatibility,
infer optional fields or nullability guarantees, or reliably detect renames. A renamed field
appears as one removal and one addition, and changes are described neutrally rather than as
definitively breaking or safe.

## Example

Choose **Load example**, then **Compare**. The sample yields five rows in traversal order:

| Path | Change | Baseline type | Updated type |
| --- | --- | --- | --- |
| `$.permissions` | Added | — | array |
| `$.price` | Type changed | number | string |
| `$.user.address` | Type changed | object | null |
| `$.user.displayName` | Added | — | string |
| `$.user.name` | Removed | string | — |

Changes to `user.id`, `active`, and `tags` produce no results (same-type primitive values, and
array contents are not inspected).

## Project structure

- `src/app/compare/` — pure TypeScript engine: JSON parsing/validation (`json-value.ts`), path
  formatting (`json-path.ts`), comparison (`compare.ts`), and the sample data. No Angular
  dependencies; covered by focused unit tests.
- `src/app/drift-detector/` — page component: editor state, actions, validation, and comparison
  lifecycle (Angular signals, OnPush).
- `src/app/json-editor/` — labeled textarea with accessible error wiring.
- `src/app/results/` — summary counts and the differences table with text badges.
