---
name: ts-function-signatures
description: "Trigger: function signature, options object, named parameters, positional vs object params, default parameters, function overloads, union params. Design TypeScript function/hook/component signatures."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Use when designing or refactoring the SIGNATURE of a TypeScript function, hook, or component — choosing positional vs options-object params, defaults, optionality, and overloads vs unions. Agnostic of framework; React skills (`react-component`, `react-hooks`) defer signature decisions here.

## Hard Rules

- Annotate params and return type explicitly for any exported/public signature; do not rely on inference for the contract.
- Prefer positional params for 1–2 required args; switch to an options object at 3+ params, or when several are optional/boolean and call sites become unreadable.
- An optional object property MUST be marked optional AND typed, even when it has a destructuring default (`{ x = 1 }: { x?: number }`).
- If EVERY property of an options object is optional, give the whole object a default (`= {}`) so the function is callable with no args. Omitting it forces a required argument and destructuring `undefined` throws.
- Prefer union-typed params over function overloads. Use overloads ONLY when the RETURN type changes based on the argument type (TS Handbook). Overloads can let the body contradict the signatures — tread carefully.
- Do not overload to express "same return, different inputs" — that is a union.

## Decision Gates

| Situation | Choice |
|-----------|--------|
| 1–2 required args | Positional |
| 3+ args, or many optional/boolean | Options object with a named `type` |
| All options optional | Options object + whole-object default `= {}` |
| Same return regardless of input shape | Union-typed param |
| Return type DEPENDS on argument type | Function overloads (carefully) |
| Boolean trap (`f(true, false)`) at call site | Options object |

## Execution Steps

1. Count required params and check for optional/boolean noise → pick positional or options object.
2. For an options object, declare a named `type`; mark optional props with `?`; add a whole-object `= {}` default only if all props are optional.
3. Always write the explicit return type.
4. If tempted to overload, ask: does the return type change with the input? If no → use a union.

## Examples

Positional vs options object, the all-optional `= {}` default, and
union-vs-overload — full TypeScript:

→ `references/signatures.md`

## Output Contract

Return:
- The chosen signature shape and the one-line reason (param count / optionality / return variance).
- The named param type, if an options object was used.
- Any overload rejected in favor of a union, and why.

## References

- `references/signatures.md` — worked TypeScript examples for each gate.
- TypeScript Handbook — More on Functions (author-time reference).
