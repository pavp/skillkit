---
name: leave-it-cleaner
description: "Trigger: cleaning the zone you already touched. Applies the Boy Scout Rule — a cohesive, proportional cleanup, orchestrating the clean-* judges. Use whenever an edit to existing code just finished or extras are invited: 'while you're at it', 'any quick wins', 'leave it cleaner', a fix shipped and the surrounding code is grubby. Judging one aspect only → that clean-* skill."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: 2.0.0
---

# Leave It Cleaner

Boy Scout Rule, any language: leave code a little cleaner than you found it.

## Activation Contract

Load right AFTER completing an edit to existing code, when a quick proportional cleanup of the zone you just touched is in scope — or on "while you're at it" / "any quick wins" / "leave it cleaner". Do NOT fire merely because code is being written: not for greenfield authoring, and not during a task (finish it first). Rules are language-agnostic; in TypeScript defer type/signature/module changes to the `ts-*` skills.

## Hard Rules

- **Task first.** Complete the user's request before any cleanup. Cleanup is secondary and must never compromise or delay it.
- **One cohesive set, zone-bounded.** Apply every safe win in the touched zone; several categories at once is fine. The touched zone IS the proportionality bound: never other functions, never other files, never a rewrite the task didn't require.
- **Scaffolding is out of scope.** Never touch `console.*`, `debugger`, or `// TODO`/`// FIXME` — do not judge "active vs trash", just leave them. Never remove a symbol still referenced anywhere you can see.
- **Task-is-cleanup guard.** If the task WAS itself a cleanup/refactor, the task IS the win — add nothing on top.
- **Never a verdict you did not earn.** Every gate's receipt verdict must name what actually happened. `clean` requires the classification to have run and held; an absent companion is `degraded`; a dropped or reverted candidate is `skipped`. Inventing a verdict is worse than a missing one — it asserts coverage that never happened.
- **Behavior-preserving, callers untouched.** Every win must leave behavior identical; unsure it is safe → skip. Auto additionally requires no reach outside the touched zone: an exported symbol is never auto-renamed even when its only visible use is in-zone (callers may live in files you never opened), and a change to a signature, params, return type, or side effect is never auto-applied. The Decision Gates mark auto vs propose.

## Decision Gates

**Touched zone** = the function(s)/block(s) containing lines you modified. Removals use whole-file reference scope (removable only if unused in the whole file) — stricter than the zone.

Full per-row conditions + companion contract in `references/gates-detail.md`.

| # | Opportunity | Action | Tier |
|---|-------------|--------|------|
| G1 | Poor variable/function name | Classify via `clean-names`; rename only a flagged `N1`–`N7`, never `clean` | Auto if non-exported and zone-local; else propose |
| G2 | Comment | Classify via `clean-comments`, declaring each comment's provenance (`fresh` = you wrote it this session, `established` = already there, and undeclared defaults to `established`); apply the remedy it returns, `delete-comment-span` removing the comment text only, never the line | Auto on a deletion remedy |
| G3 | Function doing two things / mutated arg / flag param / dead helper | Classify via `clean-functions`; act only on a flagged `F2`–`F5`, never `clean`/`defer-signature` | Propose |
| G4 | Duplicated logic / magic value / obscured intent / repeated switch / train wreck | Classify via `clean-structure`; act only on a flagged `S1`–`S5`, never `clean` | Auto if `S2`; else propose |
| G5 | Dead local var (unused in whole file) | Remove it | Auto |
| G6 | Unused import | Remove only a plain named/default import unused in the whole file (not side-effect/re-export) | Auto |
| G7 | Deeply nested block | Extract one small named function — only if no new params/side effects | Propose |
| G8 | TypeScript: types, signatures, module/imports | Follow the matching `ts-*` skill; don't invent rules | Per that skill |

No gate returned `applied`/`proposed` → do nothing; ship the task alone.

## Execution Steps

1. Finish the requested task. If the task WAS the cleanup, stop here.
2. Read `references/gates-detail.md` for the per-gate conditions, then sweep the touched zone gate by gate, `G1` through `G8`, in order. Visit every gate — a gate is never skipped for being expensive, unlikely, or already "covered" by another gate. Each visit ends in exactly one of six verdicts, and you carry all eight to step 6:

   | Verdict | Means | Allowed on |
   |---------|-------|------------|
   | `applied` | an Auto-tier win you made | any gate |
   | `proposed` | a Propose-tier win you offered | any gate |
   | `clean` | you ran the classification and it holds | any gate |
   | `degraded` | the companion skill is absent; you ran its `references/gates-detail.md` fallback instead | `G1`–`G4`, `G8` |
   | `skipped` | a candidate was flagged, then dropped as unsafe or reverted | any gate |
   | `n/a` | the gate has no subject in this zone | `G2` (no comments), `G5` (no locals), `G6` (no imports), `G7` (no nested block), `G8` (non-TS file) only |

   `G1`, `G3`, `G4` judge a property any code has — in a non-empty zone they are never `n/a`. Subject-absence is checked first: a non-TS file is `G8 n/a` whatever is installed, and `G8 degraded` is only a TS file with the `ts-*` skills absent.
3. Confirm each win is behavior-preserving; in TypeScript, align type/signature/module changes with the relevant `ts-*` skill.
4. Auto-apply the Auto-tier wins; for Propose-tier wins, offer them instead of applying. Drop anything that could affect callers.
5. Self-check: the applied changes stayed in the touched zone, changed no control flow, return type, or side effect. If any did, revert it — a reverted win downgrades its gate to `proposed` if you offer it instead, else `skipped`.
6. Emit the gate receipt, then the cleanup line.

## Output Contract

Two parts, both required, after the completed task — owed only when step 2 ran: a task-is-cleanup stop at step 1 emits neither.

**Gate receipt** — one line, all eight gates, in order, each with its step-2 verdict. Never omit a gate; never collapse the line to a summary. A gate with no verdict is a defect in the run, not a formatting choice. Every `n/a` carries its ground and every delegated `clean` carries the judge verdict that produced it, so the claim cites a fact a reader can check:

```
gates: G1 applied · G2 applied · G3 clean(F-clean) · G4 proposed · G5 skipped · G6 n/a(no-imports) · G7 n/a(no-nesting) · G8 degraded
```

**Cleanup line** — one line naming what changed, or `no safe win` when no gate came back `applied`/`proposed`:

```
also: renamed `x` → `results`, dropped a comment restating the loop
```

Unsure whether a win is cohesive or an out-of-scope refactor → read `references/example.md`, which contrasts the two.

## References

- `references/example.md` — a worked cohesive cleanup + a contrasting out-of-scope refactor (ships with this skill).
- `references/gates-detail.md` — full per-row gate conditions + the companion-skill contract (`clean-comments`, `clean-names`, `ts-*`), each a separate install with an "absent → degrade/skip" rule.
