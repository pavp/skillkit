---
name: clean-names
description: "Trigger: judging if a name reveals intent; \"better name for this\", cryptic/Hungarian/misleading identifiers, any language. Classifies a name against N1–N7 and suggests a fix; a judgment authority — never renames."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0.0"
---

# Clean Names

The judgment authority on whether an identifier reveals its intent, any language. Classifies; never renames — the actor applies.

## Activation Contract

Load when an EXISTING name needs a verdict: a cleanup actor (e.g. `leave-it-cleaner`) hands one over, or a human asks directly — "better name for this?", reviewing names in a diff or file. Not for authoring brand-new names, and not for scanning a codebase (the caller supplies the names). Rules are language-agnostic.

## Hard Rules

- **Judge, never act.** Emit a verdict per name. Never rename, rewrite, or move. Verbs are classify/keep/flag, never rename.
- **Flag only on a concrete trigger; else `clean`.** A name is a violation only when it trips an objective test: a known encoding prefix (N6), a name-vs-body mismatch (N7), a single-letter/abbreviation outside a tiny scope (N1/N5), a leaked data-structure/impl term (N2), or a reinvented standard term (N3). No trigger fires, or scope/usage is unavailable → `clean`. Rename bar = add bar: a wrong rename churns call sites, so uncertainty resolves to keep.
- **Judge the NAME only.** Flag the name, never the type/shape, the signature, or the module structure behind it. In TypeScript those belong to `ts-types` / `ts-function-signatures` / `ts-module-organization`; defer to them. See the boundary table in `references/naming-criteria.md`.
- **Suggest, don't impose.** Offer a candidate name; the actor and author decide. A standard domain/pattern term (N3) always beats an invented one.

## Decision Gates

Apply top-down; the topmost matching row wins when a name trips several. Full criteria + examples in `references/naming-criteria.md`.

| Name shape | Verdict |
|------------|---------|
| Encodes type/scope into the name: Hungarian, type-prefix (e.g. TS `I`-interface), `_`-private hint | `N6` (encoding) |
| Name promises less than the body does — hidden mutation/IO/creation | `N7` (side effect) |
| Cryptic / single-letter / abbreviation in a non-trivial scope | `N1` (not descriptive) |
| Leaks implementation over intent | `N2` (wrong abstraction) |
| Reinvents an existing domain/pattern term | `N3` (non-standard) |
| Ambiguous — reader can't tell what it acts on | `N4` (ambiguous) |
| Too short for its scope | `N5` (length vs scope) |
| Reveals intent, right abstraction, no encoding, honest | `clean` |

## Execution Steps

1. Isolate the name and the scope/body it refers to.
2. Run the gates in order; first match wins; no match → `clean`.
3. For a violation, suggest one candidate (prefer a standard N3 term). Unsure or scope unavailable → `clean`.

## Output Contract

Per name: `file:line` + verdict (`N1`–`N7`, or `clean`) + a suggested name (omit for `clean`) + a one-clause reason. Every verdict is scoped to the identifier token only, never its type/signature/module. A classification the caller consumes — no edits. For a human asking directly, phrase it plainly.

## References

- `references/naming-criteria.md` — each rule N1–N7 with bad/good examples, the reveal-intent test, the scope-vs-length rule, and the TypeScript deferral boundary (`ts-types` / `ts-function-signatures` / `ts-module-organization`).
