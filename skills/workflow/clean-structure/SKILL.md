---
name: clean-structure
description: "Trigger: judging the shape of a code body. Classifies against S1–S5, else clean — never edits. Use whenever a body smells: duplicated logic, magic numbers, obscured intent, repeated type switches, train-wreck chains (a.b().c().d()), 'is this DRY', 'one dot per line'. Whether the FUNCTION does one thing → clean-functions."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.1.0"
---

# Clean Structure

The judgment authority on the SHAPE of a code body — duplication, magic values, obscured intent, repeated type branches, reaching chains. Any language. Classifies; never edits — the actor applies.

## Activation Contract

Load when an EXISTING body of code needs a verdict on its shape: a cleanup actor (e.g. `leave-it-cleaner`) hands one over, or a human asks directly — "is this DRY?", "magic number?", "train wreck?", "should this be polymorphic?", reviewing a diff or file. Not for authoring brand-new code, and not for scanning a codebase (the caller supplies the code). Rules are language-agnostic.

## Hard Rules

- **Judge, never act.** Emit a verdict per finding. Never extract, rename, refactor, or move. Verbs are classify/keep/flag, never fix.
- **Two-stage resolution.** Stage 1: apply each rule's own trigger — a rule fires only if its objective test trips AND its inputs are available (duplicated knowledge in ≥2 citable places (S1), a domain literal with no name (S2), an expression whose form hides its effect (S3), the SAME type-switch repeated in ≥2 sites (S4), an access chain crossing ≥2 foreign objects (S5)). The uncertainty test is stage 1, before precedence — so a weak S1 never races a strong S5. Stage 2: the topmost fired row wins (Decision Gates order). No rule fires → `clean`.
- **Uncertainty → `clean`.** Every structural fix churns call sites or shifts an abstraction, so any doubt in a trigger drops that rule in stage 1. Extract bar = leave-it bar.
- **Judge the SHAPE, not the name, the types, the comments, or single-purpose.** Deferrals are load-bearing: name → `clean-names`; type/signature/arg-count → `ts-*` (TS) or name it for that language; comment → `clean-comments`; "does one thing"/dead code → `clean-functions` (F5/F4); switch-to-hierarchy redesign → `review-6-lens`. Full boundary table in `references/structure-criteria.md`.
- **S4 fires on DUPLICATION, not on a lone switch.** A lone `if/else`/`switch` over a type discriminant is `clean`; S4 needs the SAME branch set in ≥2 sites. Redesigning one switch into a hierarchy is architecture → `review-6-lens`, not this judge.
- **Suggest, don't impose.** Offer the fix direction (a single source, a named constant, an intention-revealing call, a polymorphic dispatch, one dot); the actor and author decide.

## Decision Gates

Run the two-stage resolution (Hard Rules): fire rules in stage 1, then the topmost fired row wins. **Row order IS the precedence order (S1 → S4 → S3 → S2 → S5), deliberately NOT numeric** — the more specific verdict sits higher, so a repeated branch set is `S4` not `S1`, and a magic literal inside an obscured expression is `S3` not `S2`. Collision tie-breaks + examples in `references/structure-criteria.md`.

| Body shape (the citable trigger) | Verdict |
|----------------------------------|---------|
| The same knowledge (logic, rule, constant) appears in ≥2 citable places — EXCEPT a repeated type/enum branch set, which is S4 | `S1` (duplication) |
| The SAME type/enum branch set is repeated in ≥2 sites | `S4` (repeated type switch) |
| An expression's form hides what it does (bit-twiddling, clever one-liner), incl. any bare literals inside it | `S3` (obscured intent) |
| A bare number/string literal carries domain meaning, unnamed | `S2` (magic value) |
| An access chain reaches through ≥2 foreign objects (`a.b.c.d`) | `S5` (train wreck) |
| Single source, named values, honest form, one dot | `clean` |

## Execution Steps

1. Isolate the body and note whether the scope needed for the trigger is available (S1/S4 need ≥2 sites in the supplied scope).
2. Run the gates in order; first match wins; no match → `clean`.
3. For a violation, name the citable fix direction. Unsure, or the second site isn't in scope → `clean`.

## Output Contract

Per finding: `file:line` + verdict (`S1`–`S5`, or `clean`) + a one-clause reason + the fix direction (omit for `clean`). Every verdict is scoped to the body's shape — never its names (`clean-names`), types/signatures (`ts-*`), comments (`clean-comments`), or single-purpose (`clean-functions`). A classification the caller consumes — no edits. For a human asking directly, phrase it plainly.

## References

- `references/structure-criteria.md` — each rule S1–S5 with bad/good examples, the citable-trigger test for each, the S4 duplication gate, and the boundary table (`clean-names`, `clean-functions`, `clean-comments`, `ts-*`).
