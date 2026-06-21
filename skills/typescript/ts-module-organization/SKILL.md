---
name: ts-module-organization
description: "Trigger: import type, export type, barrel file, index.ts re-export, path alias, circular dependency, verbatimModuleSyntax. Organize TypeScript modules and imports."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Use when structuring TypeScript modules — imports/exports, barrel files, path aliases, and avoiding circular dependencies. For modeling the types themselves use `ts-types`.

## Hard Rules

- Mark type-only imports/exports with `type`: `import type { User }`, or inline `import { fn, type Config }`, and `export type { User }`. Under `verbatimModuleSyntax` (opt-in; on in many bundler presets) this is MANDATORY — unmarked type imports emit as runtime imports and break. Marking `type` is correct regardless, so do it always.
- A type-only import MUST NOT cause a runtime module load; if you only need the type, `import type`.
- Use path aliases (tsconfig `baseUrl` + `paths`, e.g. `@/`) instead of deep `../../../` relative chains.
- Avoid circular dependencies — they cause runtime `undefined` exports. If two modules import each other, extract the shared piece into a third module.
- Use a barrel file (`index.ts` re-exporting a folder) only for a stable public surface. Do NOT barrel hot paths or large trees — barrels hurt tree-shaking and invite circular deps.

## Decision Gates

| Situation | Choice |
|-----------|--------|
| Importing only a type | `import type { X }` |
| Mixed value + type from one module | `import { fn, type X }` |
| Deep relative path (`../../../`) | Path alias (`@/feature/x`) |
| Folder with a small, stable public API | Barrel `index.ts` re-export |
| Large/hot folder, or tree-shaking matters | Import modules directly, no barrel |
| Two modules import each other | Extract shared code to a third module |

## Execution Steps

1. For each import, decide: value, type, or both → mark `type` accordingly.
2. Replace deep relative chains with a configured path alias.
3. Add a barrel only for a deliberately public, stable folder API; otherwise import directly.
4. If you hit a circular import, break it by extracting the shared dependency.

## Examples

```ts
import type { User } from "./types";          // type-only — elided at runtime
import { createUser, type Config } from "./user"; // mixed: value + type
export type { User } from "./types";          // re-export a type

import { Button } from "@/components/button";  // path alias, not ../../../
```

## Output Contract

Return:
- Imports/exports updated to mark `type` where applicable.
- Any path alias introduced (and the tsconfig change it needs).
- Any barrel added/avoided, with the reason.
- Any circular dependency found and how it was broken.

## References

- `ts-types` skill — for modeling the types being imported/exported.
- TypeScript Handbook — Modules; `verbatimModuleSyntax` (author-time reference).
