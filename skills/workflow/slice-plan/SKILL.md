---
name: slice-plan
description: "Trigger: sizing work BEFORE coding it. Forecasts changed lines and, over the budget (default 400), plans slice boundaries and how they ship — stacked PRs or a feature branch chain. Use whenever implementation is about to start unsized, or planned slices need a delivery call: 'plan this feature', 'will this fit one PR', 'stacked or chained?'. Diff already too big → slice-diff."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.2"
---

## Activation Contract

Load this skill when an implementation is about to start and its size is unplanned — before code exists. Forecast the changed lines of the whole change; over the review budget (default **400**), plan slice boundaries first so commits are born ordered by slice. This skill plans only: it never writes implementation code and never mutates git. Splitting a diff that is already oversized → `slice-diff`.

## Hard Rules

- Forecast BEFORE the first edit. If implementation already began, measure the real diff (`git diff --stat` against the base, resolved per the base rule below; here an unresolved base IS a STOP, since the measurement depends on it) and apply the gate to the COMBINED total: real lines + remainder forecast. Over the budget combined, the existing diff routes to `slice-diff` and the remainder gets a slice plan — never judge the halves separately.
- The forecast MUST be itemized: every file or area to touch, its own estimated `additions + deletions` as a low–high range, and a one-line basis (existing file size, a comparable past change, scope of a new file). A point estimate counts only when backed by a measured comparable — measured by you or stated by the user; a line count the user supplies is a valid basis, and greenfield work often has no other. A single unbacked total is not a forecast — itemize it or declare `unestimable`.
- The review budget defaults to **400 changed lines** (binaries excluded) — the same budget `slice-diff` enforces after the fact, so plan and remedy agree. Use a different number ONLY when the user names one explicitly: in the invocation ("budget 800"), or in the project's agent-instruction files (AGENTS.md or the runtime's equivalent) explicitly designated as the PR/review size budget — a stray line count is not a budget; when non-default, quote the exact source line in the output. Invocation beats project context. NEVER infer a budget from repo size, history, or task feel, and never adjust it mid-run; no explicit number → 400. A named budget must be a positive integer; under 50 or over 5000, restate it and STOP for confirmation before applying. Read every "budget" in this skill as the active number, including in the embedded checkpoint.
- Gate on the HIGH end of a range, never the average — for the total and for each slice alike. A total whose high end crosses the budget plans slices; a slice whose high end crosses it is cut further, and if it cannot be, it carries a stated re-forecast trigger and the reason it resisted cutting.
- Each slice is one deliverable work unit that builds and passes tests on its own, sliced along natural boundaries (layer, domain, feature); order slices so each depends only on earlier ones. Infer those boundaries from planned path segments, no config file. Domain/layer is a soft signal for WHERE to cut, never a second gate: under the budget it never justifies slicing.
- A slice plan needs a base; a forecast does not. A base the user names — in the invocation or as the repo's stated default branch — IS the base; take it and never re-ask. Otherwise resolve it per references → "Resolving the Base", skipping its network step so planning never blocks on the network, and never assume `main` unless git answers it. When git answers for a repo that is not the one being planned (the forecast's paths are absent from it), that answer does not count — report `unresolved`. Unresolved is not a STOP: emit the forecast, total, and verdict anyway, report the base as `unresolved` (or `not a git repo`), and ask for it before stating any slice's base. On a shallow repo (`git rev-parse --is-shallow-repository`), warn that a diff measured against that base is untrustworthy and recommend `git fetch --unshallow`.
- On a slice plan, ASK the user to pick the delivery strategy — never auto-select. Recommend one from the forecast's own dependency signal: every slice autonomous → **Stacked PRs to base** (each slice merges into the base in order; a slice may land partial behavior); a slice that cannot stand alone until the chain completes → **Feature Branch Chain** (slices target a draft tracker branch, nothing lands until the chain completes). If the user overrides a Feature Branch Chain recommendation and picks Stacked, warn that merging slice 1 alone lands broken or half-shipped behavior before proceeding — never silently comply. Do not mix strategies after one is chosen. Elaboration: references → "Choosing the Strategy".
- Never invent ceremony under the budget: forecast within budget → return the Output Contract's single-unit form (itemized forecast, total, verdict, checkpoint — the itemization is never optional) and let implementation proceed as one unit. No slice plan, no strategy question, no confirmation stop.
- Over the budget: SHOW the slice plan (or the `size:exception` / `unestimable` verdict with its rationale) and STOP for explicit user confirmation before implementation starts.

## Decision Gates

| Situation | Action |
|---|---|
| Total within budget | Single work unit. Return the itemized forecast, total, verdict, and checkpoint; proceed — no plan, no strategy question, no stop. |
| Over budget, natural boundaries exist | Slice plan: each slice within budget, buildable alone, ordered by dependency. STOP for confirmation. |
| Over budget, no independent boundaries — grouping by layer/domain/feature collapses to one bucket AND no cut by planned commit or file count drops a slice under budget (indivisible logic, generated code, migration) | Flag `size:exception` up front with rationale; STOP for user decision. |
| Slice plan, every slice builds and merges alone | Ask; recommend Stacked PRs to base. |
| Slice plan, a slice cannot stand alone until the chain completes | Ask; recommend Feature Branch Chain with draft tracker. |
| A range's high end crosses the budget | Total → plan slices. A single slice → cut it further; if it resists, state its re-forecast trigger and why. Never average into a pass. |
| Implementation already began | Measure the real diff; gate on real + forecast combined; over budget, existing diff → `slice-diff`, remainder → slice plan. |
| An item cannot be estimated | Verdict `unestimable`: report which items, why, and what input would unblock; STOP for user decision. Never fabricate a number to reach another verdict. |

## Execution Steps

1. List every file or area the change touches (create / modify / delete). Read enough of each to ground the estimate — do not implement anything.
2. Estimate per item with its range and basis; sum the total.
3. Apply the decision gates.
4. Slice plan: define slices — contents (files, planned commits), estimated lines, order, and what each depends on.
5. Slice plan: derive the strategy recommendation from the dependency column and present both options for the user to choose. Each slice's base follows from that choice, so state it only once the user has picked.
6. Present the plan (or the single-unit total) with the overrun checkpoint embedded, and STOP when a gate requires confirmation.
7. On confirmation of the plan — and, on a slice plan, of the strategy — restate the slice table with each slice's resolved base, then implementation follows it slice by slice, commits scoped to the current slice; the implementer opens each slice's PR in plan order on its stated base. `slice-diff` enters only if a cut diff is itself oversized.

## Output Contract

Every verdict returns the same base form: the active budget and its source (`default 400` or the user's explicit number), the itemized forecast table (item, estimated range, basis), the total, and the verdict — `single unit` (within budget), `slice plan`, `size:exception`, or `unestimable`. That base form plus the checkpoint IS the single-unit output; nothing about being under budget shortens it. For a slice plan, add a per-slice table — slice name, contents, estimated lines, depends-on — the implementation order, and a delivery-strategy block offering Stacked PRs to base and Feature Branch Chain, one recommended with its dependency-signal rationale. Once the user picks, restate the table with a `base` column carrying every slice's base. If they confirm the plan but decline to choose, say implementation stays blocked and re-ask once; never default to a strategy. Every emitted plan or single-unit verdict MUST embed this checkpoint exactly, substituting only `<budget>` with the active number, so the guard — and the budget itself — travel with the artifact into sessions where this skill is no longer loaded: "Before each commit, run `git diff --stat <base>`; if the current work unit — slice or single unit — exceeds <budget> real changed lines, stop: hand the accumulated diff to `slice-diff` (budget <budget>) and re-forecast the remainder with `slice-plan` (budget <budget>)." STOP before any implementation when a plan, exception, or `unestimable` verdict is on the table; a slice plan resumes only once the user has confirmed it AND chosen a strategy.

## References

- `slice-diff` — the after-the-fact sibling, installed separately: measurement, cut priority, and execution for a diff that already exists. Its references supply "Resolving the Base" (the fallback chain) and "Choosing the Strategy" (elaboration on the two strategies). **Absent →** resolve the base from git directly (`origin/HEAD`, then the checked-out default branch), report it `unresolved` if neither answers, and present the two strategies from their one-line definitions in Hard Rules; never invent strategy semantics.
