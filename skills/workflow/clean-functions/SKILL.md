---
name: clean-functions
description: "Trigger: judging if a function does one thing; \"split this function\", \"too many props\", flag params, mutated-arg side effects, dead helpers, \"is this still used\". Classifies against F2–F5, defers arg-count, else clean; never edits."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0.0"
---

# Clean Functions

The judgment authority on whether a function does ONE thing, any language. Classifies; never edits — the actor applies.

## Activation Contract

Load when an EXISTING function (or React component) needs a verdict: a cleanup actor (e.g. `leave-it-cleaner`) hands one over, or a human asks directly — "does this do too much?", "split this?", "too many props?", "is this still used?", reviewing a function in a diff or file. Not for authoring brand-new functions, and not for scanning a codebase (the caller supplies the function). Rules are language-agnostic; arg-count (F1) is the one TS-specific fork.

## Hard Rules

- **Judge, never act.** Emit a verdict per function. Never split, delete, rewrite, or move. Verbs are classify/keep/flag, never refactor.
- **Two-stage resolution.** Stage 1: apply each rule's own trigger (Decision Gates, col 1); a rule fires only if its trigger is met AND its inputs are available. Stage 2: the topmost fired row wins. The uncertainty test is stage 1, before precedence — so a weak F3 never races a strong F5. No rule fires → `clean`.
- **Uncertainty → `clean`.** Cost to split ≥ cost to leave it: a wrong split churns call sites, so any doubt in stage 1 drops that rule.
- **Judge the BODY's shape, not the name or the types.** A name-honesty overlap (F2/F3) resolves to `clean-names` N7; parameter types/shape/return belong to `ts-types` / `ts-function-signatures`. Boundary table in `references/function-criteria.md`.
- **F1 (arg-count) has no verdict token** — it always emits `defer-signature` (see the gate), never an `F1` code.
- **Suggest, don't impose.** Offer the fix boundary you see; the actor and author decide.

## Decision Gates

Run the two-stage resolution (Hard Rules): a row fires in stage 1 only if its trigger is met AND its inputs are available; the topmost fired row then wins. `F1` is not a verdict token. Full criteria + examples in `references/function-criteria.md`.

| Function shape (the citable trigger) | Verdict |
|----------------|---------|
| Mutates state whose allocation is NOT citable in-scope (caller-supplied / injected); in-scope allocation → not F2 | `F2` (output arg) |
| A boolean/enum parameter forks THIS body into ≥2 behaviors (literal or variable at the call site alike) | `F3` (flag arg) |
| No reference exists AND caller asserted scope is complete; NOT an entry point / framework hook / public export | `F4` (dead) |
| Body has ≥2 citable IO/compute boundary lines you can point at | `F5` (not single-purpose) |
| Concern is "too many args/props" | `defer-signature` (no F-token; TS → `ts-function-signatures`; else name it, no number) |
| One thing, honest inputs, no dead code | `clean` |

## Execution Steps

1. Isolate the function and body; note whether call sites are available and whether the caller asserted the search scope is complete (F4 needs this).
2. Run the two-stage resolution against the Decision Gates; no rule fires → `clean`.
3. For a violation, name the citable fix boundary (the ≥2 IO/compute lines, the value-return, the two functions, or the deletion). Arg-count → `defer-signature`, hand off.

## Output Contract

Per function: `file:line` + verdict (`F2`–`F5`, `defer-signature`, or `clean`) + a one-clause reason + the suggested boundary (omit for `clean`). Every verdict is scoped to the function's behavior/shape, never its name (`clean-names`) or its parameter types/signature (`ts-*`). A classification the caller consumes — no edits. For a human asking directly, phrase it plainly.

## References

- `references/function-criteria.md` — each rule F2–F5 with bad/good examples, the two-stage resolution, the citable-boundary test for F5, the complete-scope assertion and entry-point/export exceptions for F4, and the boundary table (`clean-names` for names, `ts-types` / `ts-function-signatures` for types/signatures, F1 deferral).
