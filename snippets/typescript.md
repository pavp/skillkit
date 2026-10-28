# TypeScript snippet for AGENTS.md

Copy the block below into your TypeScript project's `AGENTS.md`. If the project also has a `CLAUDE.md`, Claude Code reads only that file: add `@AGENTS.md` to it, or paste the block there instead. After `npx skills update`, replace everything between the two `skillkit typescript snippet` markers with the new block.

````markdown
<!-- skillkit typescript snippet v1.0.0 -->
## TypeScript skills (skillkit)

Before you create or edit a `.ts`/`.tsx` file, load the matching skill by name — through your skill tool, or by reading its whole `SKILL.md` — even when the request names a feature or a bug, not a type. When you delegate such an edit, name these skills in the delegation prompt. Skip a skill that is not installed.

| You are about to… | Load |
|---|---|
| define or change a type, interface, union, enum, type guard, or a value of unknown shape | `ts-types` |
| add or change a function, hook, or component signature: params, options object, defaults, overloads, a union or generic on a param or return | `ts-function-signatures` |
| add or change imports or exports, a barrel `index.ts`, a path alias, or move a type or value to another module | `ts-module-organization` |

Rules that hold even when no skill was loaded:

- Never use `any`; take `unknown` for untrusted input, then narrow.
- Prefer a literal union, or a `const` object plus a derived type, over `enum`.
- Type config and literal objects with `satisfies`, not `as`.
- Annotate params and return type of every exported signature explicitly.
- Switch to an options object at 3+ params; prefer union params over overloads unless the return type changes.
- Mark type-only imports and exports with `type` (`import type`, `export type`).
- Break circular imports by extracting the shared piece; no barrel files on hot paths.
<!-- /skillkit typescript snippet -->
````
