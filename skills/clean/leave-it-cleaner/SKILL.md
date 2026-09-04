---
name: leave-it-cleaner
description: "Trigger: cleaning the zone you already touched. Applies the Boy Scout Rule — a cohesive, proportional cleanup, orchestrating the clean-* judges. Use whenever an edit to existing code just finished or extras are invited: 'while you're at it', 'any quick wins', 'leave it cleaner', a fix shipped and the surrounding code is grubby. Judging one aspect only → that clean-* skill."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: 2.2.0
---

# Leave It Cleaner

Boy Scout Rule, any language: leave code a little cleaner than you found it.

## Activation Contract

Load right AFTER completing an edit to existing code, when a quick proportional cleanup of the zone you just touched is in scope — or on "while you're at it" / "any quick wins" / "leave it cleaner". Do NOT fire merely because code is being written: not for greenfield authoring, and not during a task (finish it first). Rules are language-agnostic; in TypeScript defer type/signature/module changes to the `ts-*` skills.

## Hard Rules

- **Task first.** Complete the user's request before any cleanup. Cleanup is secondary and must never compromise or delay it. A win the task edit produced on its own still counts as that gate's `applied` — the receipt records what the zone ended up with, not which pass did it.
- **One cohesive set, zone-bounded.** Apply every safe win in the touched zone; several categories at once is fine. The touched zone IS the proportionality bound: never other functions, never other files, never a rewrite the task didn't require.
- **Scaffolding is out of scope.** Never touch `console.*`, `debugger`, or `// TODO`/`// FIXME` — do not judge "active vs trash", just leave them. Never remove a symbol still referenced anywhere you can see.
- **Task-is-cleanup guard.** If the task WAS itself a cleanup/refactor, the task IS the win — add nothing on top.
- **Never a verdict you did not earn.** Every gate's receipt verdict must name what actually happened. `clean` requires the classification to have run and held; an absent companion is `degraded`; a dropped or reverted candidate is `skipped`; and a sighting nothing settled owes `+candidate` plus its `unresolved:` entry — omitting the suffix claims the gate saw nothing. Inventing a verdict is worse than a missing one — it asserts coverage that never happened.
- **Behavior-preserving, callers untouched.** Every win must leave behavior identical; unsure it is safe → skip. Auto additionally requires no reach outside the touched zone: an exported symbol is never auto-renamed even when its only visible use is in-zone (callers may live in files you never opened), and a change to a signature, params, return type, or side effect is never auto-applied. The Decision Gates mark auto vs propose.

## Decision Gates

**Touched zone** = the function(s)/block(s) containing lines you modified. Removals use whole-file reference scope (removable only if unused in the whole file) — stricter than the zone.

Full per-row conditions + companion contract in `references/gates-detail.md`.

| # | Opportunity | Action | Tier |
|---|-------------|--------|------|
| G1 | Poor variable/function name | Classify via `clean-names`; rename only a flagged `N1`–`N7`, never `clean` | Auto if non-exported and zone-local; else propose |
| G2 | Comment | Classify via `clean-comments`, declaring each comment's provenance (`fresh` = you wrote it this session, `established` = already there, and undeclared defaults to `established`); apply the remedy it returns, recording the bar each verdict names, `delete-comment-span` removing the comment text only, never the line | Auto on a deletion remedy |
| G3 | Function doing two things / mutated arg / flag param / dead helper | Classify via `clean-functions`; act only on a flagged `F2`–`F5`, never `clean`/`defer-signature` | Propose |
| G4 | Duplicated logic / magic value / obscured intent / repeated switch / train wreck | Classify via `clean-structure`; act only on a flagged `S1`–`S5`, never `clean` | Auto if `S2`; else propose |
| G5 | Dead local var (unused in whole file) | Remove it | Auto |
| G6 | Unused import | Remove only a plain named/default import unused in the whole file (not side-effect/re-export) | Auto |
| G7 | Deeply nested block | Extract one small named function — only if no new params/side effects | Propose |
| G8 | TypeScript: types, signatures, module/imports | Follow the matching `ts-*` skill; don't invent rules | Per that skill |

No gate returned `applied`/`proposed` → apply nothing, but still emit the receipt and every `unresolved:` line.

## Execution Steps

1. Finish the requested task. If the task WAS the cleanup, stop here.
2. Read `references/gates-detail.md` for the per-gate conditions, then sweep the touched zone gate by gate, `G1` through `G8`, in order. Visit every gate — a gate is never skipped for being expensive, unlikely, or already "covered" by another gate. Each visit ends in exactly one of six verdicts — `degraded` and `skipped` additionally carrying the `+candidate` suffix — and you carry all eight to step 6:

   | Verdict | Means | Allowed on | `+candidate` |
   |---------|-------|------------|---|
   | `applied` | an Auto-tier win you made | any gate | — |
   | `proposed` | a Propose-tier win you offered | any gate | — |
   | `clean` | you ran the classification and it holds | any gate | when the judge returned `defer` |
   | `degraded` | the companion skill is absent; you ran its `references/gates-detail.md` fallback instead | `G1`–`G4`, `G8` | when the fallback saw a smell |
   | `skipped` | a candidate was flagged, then dropped as unsafe or reverted | any gate | always |
   | `n/a` | the gate's subject is absent from the zone | `G2` (no comments), `G5` (no locals at all), `G6` (no imports), `G7` (no nesting at all), `G8` (non-TS file) only | — |

   `G1`, `G3`, `G4` judge a property any code has — in a non-empty zone they are never `n/a`. Subject-absence is checked first: a non-TS file is `G8 n/a` whatever is installed, and `G8 degraded` is only a TS file with the `ts-*` skills absent.

   A subject that is present but does not qualify is `clean`, not `n/a` — imports that are all used, nesting too shallow to extract. `G5 n/a` needs zero locals and `G7 n/a` zero nested blocks; locals that are all live, or one nested block too shallow to extract, are `clean(no-dead-locals)` / `clean(nesting-too-shallow)`. Cite the ground on every `clean` and every `n/a` (`clean(all-imports-used)`, `n/a(no-imports)`).

   A gate that SAW something it could not settle owes the suffix `+candidate` and one `unresolved:` line. Without it the verdict claims the gate found nothing — a coverage claim you did not earn. `skipped` names a candidate by definition, so it is ALWAYS `skipped+candidate`, whatever the gate and whoever dropped it — step 4's caller-safety drop and step 5's revert included. `degraded` takes it when the fallback saw a smell it was told to leave alone, and `clean` when the judge itself returned `defer`/`defer-signature` — a real finding you may not act on is not a gate that holds. One primary verdict per gate: a `degraded` fallback that both won something and saw something records the win in the cleanup line and the gate as `degraded+candidate`.
3. Confirm each win is behavior-preserving; in TypeScript, align type/signature/module changes with the relevant `ts-*` skill.
4. Auto-apply the Auto-tier wins; for Propose-tier wins, offer them instead of applying. Drop anything that could affect callers — a drop is `skipped+candidate`, and a `+candidate` sighting is never offered as a Propose-tier win: it goes to `unresolved:` and nowhere else. Unsure whether a win is cohesive or an out-of-scope refactor → read `references/example.md`, which contrasts the two.
5. Self-check: the applied changes stayed in the touched zone, changed no control flow, return type, or side effect. If any did, revert it — a reverted win downgrades its gate to `proposed` if you offer it instead, else `skipped+candidate`.
6. Emit the gate receipt, then the cleanup line, then one `unresolved:` line per `+candidate` gate. A `+candidate` in the receipt with no matching `unresolved:` line is a defect in the run.

## Output Contract

Two parts after the completed task, plus a third when any gate carries `+candidate` — owed only when step 2 ran: a task-is-cleanup stop at step 1 emits none.

**Gate receipt** — one line, all eight gates, in order, each with its step-2 verdict. Never omit a gate; never collapse the line to a summary. A gate with no verdict is a defect in the run, not a formatting choice. Every `n/a` and every `clean` carries its ground — a delegated `clean` citing the judge verdict that produced it — so the claim cites a fact a reader can check:

```
gates: G1 applied · G2 applied · G3 degraded+candidate · G4 proposed · G5 skipped+candidate · G6 clean(all-imports-used) · G7 n/a(no-nesting) · G8 clean(ts-types: clean)
```

**Cleanup line** — one line, `also:` then what changed. When no gate came back `applied`/`proposed` the whole line is `no safe win`, without the prefix — or `no safe win (see unresolved)` when any gate carries `+candidate`:

```
also: renamed `x` → `results`, dropped a comment restating the loop
```

**Unresolved** — one line per `+candidate` gate, naming what you saw, where, and why no verdict settled it. Never propose the fix here; a candidate no judge ruled on is not yet a win to offer:

```
unresolved: G3 `flush` may do two things (drains the queue and retries) — `clean-functions` absent, so no verdict
unresolved: G5 the `seen` map looks dead but a callback may read it — dropped rather than removed unverified
```

## References

- `references/example.md` — a worked cohesive cleanup + a contrasting out-of-scope refactor (ships with this skill).
- `references/gates-detail.md` — full per-row gate conditions + the companion-skill contract (`clean-comments`, `clean-names`, `ts-*`), each a separate install with an "absent → degrade/skip" rule.
