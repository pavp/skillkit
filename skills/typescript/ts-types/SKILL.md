---
name: ts-types
description: "Trigger: TypeScript types, interface, type alias, union, enum, const object, type guard, unknown vs any, model data. Model TypeScript types and interfaces well."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Use when modeling data shapes in TypeScript — types, interfaces, unions, enums, narrowing. For function/hook/component SIGNATURES use `ts-function-signatures`.

## Hard Rules

- Type-only value set → a bare union (`"a" | "b"`): zero runtime cost, tree-shakeable.
- Value set you also use at runtime (iterate/validate) → a `const` object + derived type: `const X = {...} as const; type T = (typeof X)[keyof typeof X]`.
- Avoid `enum` (larger bundle, poor tree-shaking) — a union or `const` object covers nearly every case.
- Type config/literal objects with `satisfies`, not `as`. `as` bypasses checking; `satisfies` validates against a type WITHOUT widening or losing the inferred shape.
- Keep interfaces FLAT: a nested object becomes its own named interface, referenced — never inline a `{ ... }` object type inside another.
- Never use `any`. Use `unknown` for untrusted input, then narrow; use generics for flexible-but-typed values.
- Narrow with a `value is T` type guard for conditional logic; use an assertion function (`asserts v is T`, throws on fail) to validate external input once and narrow for the rest of the scope.
- Reach for built-in utility types before hand-writing a derived shape (`Pick`, `Omit`, `Partial`, `Record`, `ReturnType`, `NonNullable`, …).

## Decision Gates

| Need | Choice |
|------|--------|
| Value set, type only (no runtime use) | Bare union `"a" \| "b"` |
| Value set you also iterate/validate at runtime | `const` object + derived type |
| Validate a literal/config object against a type | `satisfies` (keeps inference) — not `as` |
| Object property holding another object | A dedicated named interface, referenced |
| Untrusted input, branch on it | `unknown` + a `value is T` type guard |
| Untrusted input, validate-or-throw once | Assertion function `asserts v is T` |
| A shape derived from an existing type | Utility type (`Pick`/`Omit`/`Partial`/…), not a re-declaration |
| Extend a shape | `interface B extends A` |

## Execution Steps

1. Identify what is being modeled: a value set, an entity shape, or a derived shape.
2. Value set → union (type only) or `const` object + `(typeof X)[keyof typeof X]` (runtime). Entity → flat interface. Derived → utility type.
3. Validate literal/config objects with `satisfies`; never widen with `as`.
4. For untrusted input, type it `unknown`, then narrow with a guard or an assertion function. Avoid `any` everywhere.

## Examples

Worked TypeScript for each gate — union vs const-object, `satisfies` vs `as`, type guard vs assertion function, flat interfaces:

→ `references/examples.md`

## Output Contract

Return:
- The chosen modeling approach and the one-line reason (value set / entity / derived).
- Any `const`-object type, named nested interface, or type guard introduced.
- Any `any` removed in favor of `unknown` + guard or a generic.

## References

- `ts-function-signatures` skill — for function/hook/component signatures.
- TypeScript Handbook — Everyday Types & Utility Types (author-time reference).
