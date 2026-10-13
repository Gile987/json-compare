# API Response Drift Detector — implementation brief

You are implementing a small, polished Angular developer tool. Follow this brief and build the working MVP, rather than only proposing another plan. Inspect the existing workspace and its instructions first. If there is no application, scaffold one. Make routine implementation decisions yourself; ask only about genuine blockers. Do not deploy or add external services.

## 1. Product goal

Compare two pasted JSON responses and report structural differences that might affect a frontend consumer. Ignore changes to primitive values when their types remain the same.

This compares two samples, not API schemas. It cannot prove compatibility, infer optional fields or nullability guarantees, or reliably detect renames. Describe changes neutrally. A renamed field appears as one removal and one addition.

## 2. Technology and coding constraints

- Angular 22.2.2 (latest stable release verified on 2026-10-13) with standalone components; no NgModules. Do not use next or release-candidate builds.
- TypeScript strict mode and strict Angular template checking.
- Use Signals for local state and computed values for derived counts.
- Use @if and @for, with stable tracking keys.
- Use OnPush change detection and typed component inputs/outputs where needed.
- Use SCSS and native HTML controls; no component library or heavy editor dependency.
- No explicit any, unsafe double assertions, or non-null assertions to silence errors. Parse JSON into unknown and narrow it through a typed validation boundary.
- No comments inside source code unless requested. Put explanations in the README.
- Keep comparison logic in pure TypeScript functions independent of Angular.
- No backend, authentication, database, API requests, analytics, or storage of pasted input. Everything runs in browser memory.
- No NgRx, unnecessary RxJS pipelines, generic framework layers, or premature abstractions.
- Use Angular 22.2-compatible CLI and package versions and commit the package lockfile. Verify Node.js and TypeScript compatibility against the official Angular compatibility table and package engine/peer requirements before scaffolding. Use the stable CLI defaults for the application and testing setup. Do not force legacy Angular 19 tooling.

## 3. MVP interface

One page with a short title and explanation, two labeled multiline editors, and a results section.

Editors:
- Left: Baseline response.
- Right: Updated response.
- Monospaced text, comfortable height, visible labels, spellcheck disabled.
- Side by side on desktop, stacked on narrow screens.

Actions:
- Compare: explicitly parses and compares both inputs.
- Load example: fills both inputs with the sample below and clears previous results.
- Clear: resets inputs, validation errors, and results.

Results:
- Show total changes and counts for Added, Removed, and Type changed.
- Each row shows path, a text badge for the kind, baseline type, and updated type. Use an em dash for a missing side.
- Use color only as a supplement to text labels.
- Distinguish the initial state from a completed comparison with zero changes.
- Zero-change message: “No structural differences found. Primitive values and array contents are not compared.”
- Keep this visible near the results: “Arrays are compared by type only; their items are not inspected.”
- Do not label changes as definitively breaking or safe.
- Editing either input clears previous results and errors so stale comparisons are never shown as current.

Validation:
- Empty input produces a field-specific “Paste a JSON response” message.
- Invalid JSON produces a field-specific error without crashing; validate both sides on Compare.
- Accept all valid JSON root types, including arrays, primitives, and null.
- Associate errors with editors accessibly and announce comparison status with a polite live region.
- Render user-controlled text through Angular interpolation, never innerHTML.

Aim for a restrained developer-tool appearance: neutral colors, strong typography, clear spacing, accessible contrast, and visible keyboard focus. No elaborate animations or theme switcher in the MVP.

## 4. Exact comparison rules

Recognized types: object, array, string, number, boolean, null. Detect null and arrays before treating values as objects. Integers and decimals are both number.

1. If the types at a path differ, emit exactly one Type changed result at that path and stop descending there.
2. If both values are objects, compare their own property keys recursively. Property order does not matter; key matching is case-sensitive.
3. A key present only in the updated object is Added.
4. A key present only in the baseline object is Removed.
5. For an added or removed object, emit one result for that property, not separate results for every descendant.
6. If both values are arrays, emit no result and do not compare items, length, or order. An array changing to another type is still a Type changed result.
7. If both values have the same primitive type, emit no result, regardless of their values.
8. Missing and null are distinct. Use own-property checks, not truthiness or comparisons to null.
9. Do not mutate either input. Handle keys such as __proto__, constructor, and hasOwnProperty as ordinary JSON keys without merging them into application objects.
10. Return deterministic output by visiting the union of object keys in ascending code-unit order.

Paths:
- Root is $.
- Identifier-like keys matching [A-Za-z_$][A-Za-z0-9_$]* use dot notation, for example $.user.name.
- Other keys use brackets with a JSON-escaped string, for example $["display.name"] or $[""].
- Construct paths from key segments, not by splitting a dotted string. A literal key containing a dot must remain distinguishable from nesting.

Use a recursive JsonValue type, a JsonType string union, and a discriminated union for differences. Added records have an updated type, Removed records have a baseline type, and Type changed records have both. Avoid optional fields that allow invalid combinations. Return a readonly list where practical.

## 5. Example and required result

Baseline:

```json
{
  "user": {
    "id": 42,
    "name": "Mladen",
    "address": { "city": "Belgrade" }
  },
  "price": 99.99,
  "active": true,
  "tags": ["customer"]
}
```

Updated:

```json
{
  "user": {
    "id": 43,
    "displayName": "Marko",
    "address": null
  },
  "price": "99.99",
  "active": false,
  "tags": ["customer", "premium"],
  "permissions": ["read"]
}
```

Expected results in traversal order:

| Path | Change | Baseline type | Updated type |
| --- | --- | --- | --- |
| $.permissions | Added | — | array |
| $.price | Type changed | number | string |
| $.user.address | Type changed | object | null |
| $.user.displayName | Added | — | string |
| $.user.name | Removed | string | — |

Total: 5 changes, consisting of 2 added, 1 removed, and 2 type changes. Changes to user.id, active, and tags produce no results.

## 6. Suggested structure

Keep the feature small. Adapt names to an existing repository rather than restructuring unrelated code.

- A comparison page/container: editor state, actions, validation, and comparison lifecycle.
- A results component: typed presentation of comparison output.
- An editor component only if the duplicated editor markup warrants it.
- Pure utilities and models: JSON validation, type detection, path formatting, comparison, and sample data.
- Focused tests alongside the corresponding utilities/components.

No routing is needed for this single-page MVP unless the existing project already uses it. Do not add a service merely to wrap a pure function.

## 7. Implementation sequence

### Phase 1 — Foundation and comparison engine

Inspect the workspace, confirm compatible tooling, and create or reuse the Angular application. Define strict models and implement parsing/validation, type detection, path formatting, and comparison. Add focused tests for the rules below before building the UI around the engine.

### Phase 2 — Working interface

Build the two editors, Compare/Load example/Clear actions, field validation, results table, and summary counts. Implement initial, invalid, compared-with-changes, and compared-without-changes states. Ensure input edits invalidate results.

### Phase 3 — Polish and verification

Check responsive layout and keyboard operation. Run focused tests and a production build. Fix failures caused by the implementation. Write a concise README with setup commands, behavior, example usage, array limitations, and the distinction between sample comparison and schema validation.

Complete these phases sequentially without requiring approval for each phase. If tooling or network access blocks a check, report the exact limitation and never claim the check passed.

## 8. Focused tests and acceptance criteria

Engine tests must cover:
- Identical responses and reordered object keys produce no changes.
- Different primitive values of the same type produce no changes.
- Nested additions, removals, and type changes return correct paths and types.
- Added/removed objects produce one row, and type changes stop traversal.
- Missing differs from null; null differs from object.
- Arrays with different contents, lengths, or item types produce no changes.
- Array-to-object and root-level type changes are detected.
- Primitive and null roots are supported.
- Empty, dotted, quoted, and otherwise unusual property keys produce unambiguous escaped paths.
- Special own keys such as __proto__ are compared correctly.
- Inputs remain unchanged and result order is deterministic.
- The supplied example yields exactly the five expected rows.

UI checks must establish that invalid input is attributed to the correct editor, Compare works, edits clear stale results, Clear resets the page, and zero differences is distinct from not having compared yet. Use the repository's existing test runner; in a new workspace retain the stable Angular 22.2 CLI-generated test setup. Avoid adding multiple testing frameworks.

Done means the app can be installed and run using the README, the production build succeeds, meaningful tests pass, and the complete example works in the interface. Report what was built, commands run, results, and any known limitations.

## 9. Explicitly deferred

Do not implement array item comparison, rename inference, schema generation, OpenAPI integration, AI features, API fetching, saved history, localStorage, file upload, exports, filtering, code-editor libraries, authentication, or deployment in this MVP. These can be separate follow-up tasks after the basic tool works.

## 10. Version verification sources

Verified on 2026-10-13: Angular 22.2.2 is the latest stable release; 22.3.0-next.1 is a prerelease and is excluded.

- Official releases: https://github.com/angular/angular/releases
- Compatibility requirements: https://angular.dev/reference/versions
- Release policy: https://angular.dev/reference/releases
