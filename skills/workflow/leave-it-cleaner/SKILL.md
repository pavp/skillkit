---
name: leave-it-cleaner
description: "Trigger: cleaning the zone you already touched. Applies the Boy Scout Rule — a cohesive, proportional cleanup, orchestrating the clean-* judges. Use whenever an edit to existing code just finished or extras are invited: 'while you're at it', 'any quick wins', 'leave it cleaner', a fix shipped and the surrounding code is grubby. Judging one aspect only → that clean-* skill."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: 1.1.0
---

# Leave It Cleaner

Boy Scout Rule, any language: leave code a little cleaner than you found it.

## Activation Contract

Load right AFTER completing an edit to existing code, when a quick proportional cleanup of the zone you just touched is in scope — or on "while you're at it" / "any quick wins" / "leave it cleaner". Do NOT fire merely because code is being written: not for greenfield authoring, and not during a task (finish it first). Rules are language-agnostic; in TypeScript defer type/signature/module changes to the `ts-*` skills.

## Hard Rules

- **Task first.** Complete the user's request before any cleanup. Cleanup is secondary and must never compromise or delay it.
- **One cohesive set, zone-bounded.** Apply every safe win in the touched zone — several categories at once is fine (rename + name a magic number + drop a redundant comment). The touched zone IS the proportionality bound: never other functions, never other files, never a rewrite the task didn't require.
- **Scaffolding is out of scope.** Never touch `console.*`, `debugger`, or `// TODO`/`// FIXME` — do not judge "active vs trash", just leave them. Never remove a symbol still referenced anywhere you can see.
- **Task-is-cleanup guard.** If the task WAS itself a cleanup/refactor, the task IS the win — add nothing on top.
- **Auto-apply only what can't affect callers.** A change is auto-applicable only if it is behavior-preserving AND cannot affect anything outside the touched zone. A rename is auto only when the symbol is NOT exported / not part of the public surface AND is referenced only within the zone — an exported symbol is never auto-renamed even if its only visible use is in-zone (callers may live in files you never opened). Changing a signature, params, return type, or a side effect is likewise never auto-applied; skip it or propose. The Decision Gates mark which rows are auto vs propose.
- **Behavior-preserving.** Must not change what the code does. Unsure it is safe → skip.

## Decision Gates

**Touched zone** = the function(s)/block(s) containing lines you modified. Removals use whole-file reference scope (removable only if unused in the whole file) — stricter than the zone.

Full per-row conditions + companion contract in `references/gates-detail.md`.

| Opportunity | Action | Tier |
|-------------|--------|------|
| Poor variable/function name | Classify via `clean-names`; rename only a flagged `N1`–`N7`, never `clean` | Auto if non-exported and zone-local; else propose |
| Comment | Classify via `clean-comments`; delete only a `noise` verdict | Auto if `noise` |
| Function doing two things / mutated arg / flag param / dead helper | Classify via `clean-functions`; act only on a flagged `F2`–`F5` verdict, never `clean`/`defer-signature` | Propose |
| Duplicated logic / magic value / obscured intent / repeated switch / train wreck | Classify via `clean-structure`; act only on a flagged `S1`–`S5`, never `clean` | Auto if `S2`; else propose |
| Dead local var (unused in whole file) | Remove it | Auto |
| Unused import | Remove only a plain named/default import unused in the whole file (not side-effect/re-export) | Auto |
| Deeply nested block | Extract one small named function — only if no new params/side effects | Propose |
| TypeScript: types, signatures, module/imports | Follow the matching `ts-*` skill; don't invent rules | Per that skill |
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
- `references/gates-detail.md` — full per-row gate conditions + the companion-skill contract (`clean-comments`, `clean-names`, `ts-*`), each a separate install with an "absent → degrade/skip" rule.
