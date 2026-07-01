---
name: leave-it-cleaner
description: "Trigger: \"while you're at it\", \"any quick wins\", \"leave it cleaner\", or just finished editing existing code. Apply the Boy Scout Rule — a cohesive, proportional cleanup of the zone you already touched."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: 1.0.0
---

# Leave It Cleaner

Boy Scout Rule, any language: leave code a little cleaner than you found it.

## Activation Contract

Load right AFTER completing an edit to existing code, when a quick proportional cleanup of the zone you just touched is in scope — or on "while you're at it" / "any quick wins" / "leave it cleaner". Do NOT fire merely because code is being written: not for greenfield authoring, and not during a task (finish it first). The rules below are language-agnostic; in TypeScript, defer to the `ts-*` skills (References) for type, signature, and module/import changes.

## Hard Rules

- **Task first.** Complete the user's request before any cleanup. Cleanup is secondary and must never compromise or delay it.
- **One cohesive set, zone-bounded.** Apply every safe win in the touched zone — several categories at once is fine (rename + name a magic number + drop a redundant comment). The touched zone IS the proportionality bound: never other functions, never other files, never a rewrite the task didn't require.
- **Scaffolding is out of scope.** Never touch `console.*`, `debugger`, or `// TODO`/`// FIXME` — do not judge "active vs trash", just leave them. Never remove a symbol still referenced anywhere you can see.
- **Task-is-cleanup guard.** If the task WAS itself a cleanup/refactor, the task IS the win — add nothing on top.
- **Auto-apply only what can't affect callers.** A change is auto-applicable only if it is behavior-preserving AND cannot affect anything outside the touched zone. Renaming a symbol referenced outside the zone, or changing a signature, params, return type, or a side effect — is NOT auto-applied; skip it (or propose, don't apply). The Decision Gates mark which rows are auto vs propose.
- **Behavior-preserving.** Must not change what the code does. Unsure it is safe → skip.

## Decision Gates

**Touched zone** = the function(s)/block(s) containing lines you modified. Removals use whole-file reference scope by design (an import or symbol counts as removable only if unused in the whole file), which is stricter than the zone.

| Opportunity | Action | Tier |
|-------------|--------|------|
| Poor variable/function name | Rename to reveal intent | Auto if the symbol is referenced only within the touched zone; else propose |
| Comment | Classify via `clean-comments` (References); delete only a `noise` verdict, never `load-bearing`/`trailing`/`commented-out`/`out-of-domain` | Auto if `noise` |
| Magic number | Extract to a named `const` | Auto |
| Dead local var (unused in the whole file) | Remove it | Auto |
| Unused import | Remove ONLY if plain named/default import, unused in the whole file, not a side-effect (`import 'x'`) or re-export; else skip | Auto |
| Deeply nested block / function doing two things | Extract one small, well-named function — only if no new params and no side effects; else skip | Propose |
| TypeScript: types, signatures, or module/imports | Follow the matching `ts-*` skill (References); do not invent rules | Per that skill |
| No safe win in the zone | Do nothing; ship the task alone | — |

## Execution Steps

1. Finish the requested task. If the task WAS the cleanup, stop here.
2. Scan the touched zone for the cohesive set of wins in the gates above.
3. Confirm each is behavior-preserving; in TypeScript, align type/signature/module changes with the relevant `ts-*` skill.
4. Auto-apply the Auto-tier wins; for Propose-tier wins, offer them instead of applying. Drop anything that could affect callers.
5. Self-check: the applied changes stayed in the touched zone, changed no control flow, return type, or side effect. If any did, revert it.
6. Annotate in one line what was cleaned.

## Output Contract

The completed task, plus one line naming the cleanup (or nothing if there was no safe win). One line, not a report: ``also: renamed `x` → `results`, named the tax rate``.

See `references/example.md` for a worked cohesive, behavior-preserving cleanup and a contrasting out-of-scope refactor.

## References

- `references/example.md` — a worked cohesive cleanup + a contrasting out-of-scope refactor (ships with this skill).

**Companion skills — referenced by name, each a separate install. If one is absent, never guess: degrade or skip.**

- `clean-comments` — classifies a comment (noise / load-bearing / commented-out / trailing / out-of-domain); delete only a `noise` verdict. Absent → delete only a comment that plainly restates code, never a trailing one.
- `ts-types`, `ts-function-signatures`, `ts-module-organization` — TS style authority for types, signatures, modules. Defer when installed; absent → skip that cleanup.
