---
name: slice-plan
description: "Trigger: sizing work BEFORE coding it. Forecasts the changed lines of planned work and, over the budget (default 400), plans slice boundaries — files and commits per slice. Use whenever implementation is about to start with no size plan, or is mid-flight unsized: 'plan this feature', 'will this fit one PR', a ticket bigger than one review. Diff already too big → slice-diff."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.2"
---

## Activation Contract

Load this skill when an implementation is about to start and its size is unplanned — before code exists. Forecast the changed lines of the whole change; over the review budget (default **400**), plan slice boundaries first so commits are born ordered by slice. This skill plans only: it never writes implementation code and never mutates git. Splitting a diff that is already oversized → `slice-diff`.

## Hard Rules

- Forecast BEFORE the first edit. If implementation already began, measure the real diff (`git diff --stat` against the base; resolve the base per `slice-diff`'s fallback chain, and if it cannot resolve, STOP and ask) and apply the gate to the COMBINED total: real lines + remainder forecast. Over the budget combined, the existing diff routes to `slice-diff` and the remainder gets a slice plan — never judge the halves separately.
- The forecast MUST be itemized: every file or area to touch, its own estimated `additions + deletions` as a low–high range, and a one-line basis (existing file size, a comparable past change, scope of a new file). A point estimate counts only when backed by a measured comparable. A single unbacked total is not a forecast — itemize it or declare `unestimable`.
- The review budget defaults to **400 changed lines** (binaries excluded) — the same budget `slice-diff` enforces after the fact, so plan and remedy agree. Use a different number ONLY when the user names one explicitly: in the invocation ("budget 800"), or in the project's agent-instruction files (AGENTS.md or the runtime's equivalent) explicitly designated as the PR/review size budget — a stray line count is not a budget; when non-default, quote the exact source line in the output. Invocation beats project context. NEVER infer a budget from repo size, history, or task feel, and never adjust it mid-run; no explicit number → 400. A named budget must be a positive integer; under 50 or over 5000, restate it and STOP for confirmation before applying. Read every "budget" in this skill as the active number, including in the embedded checkpoint.
- When an estimate is uncertain and its plausible range crosses the budget (high end above it), plan slices; never average the range into a pass.
- Each slice is one deliverable work unit that builds and passes tests on its own, sliced along natural boundaries (layer, domain, feature); order slices so each depends only on earlier ones. Infer those boundaries from planned path segments, no config file. Domain/layer is a soft signal for WHERE to cut, never a second gate: under the budget it never justifies slicing.
- Resolve the planned base branch from git via `slice-diff`'s fallback chain — never assume `main`. If it cannot resolve, STOP and ask. State the resolved base once, and per slice when a slice's base differs.
- Over the budget, ASK the user to pick the delivery strategy — never auto-select. Recommend one from the forecast's own dependency signal: every slice autonomous → Stacked PRs to base; a slice that cannot stand alone until the chain completes → Feature Branch Chain with a draft tracker. Point to `slice-diff`'s "Choosing the Strategy" for the definitions instead of restating them; do not mix strategies after one is chosen.
- Never invent ceremony under the budget: forecast within budget → state the total in one line and let implementation proceed as a single unit. No slice plan, no confirmation stop — but the overrun checkpoint below still applies.
- Over the budget: SHOW the slice plan and STOP for explicit user confirmation before implementation starts.

## Decision Gates

| Situation | Action |
|---|---|
| Total within budget | Single work unit. State the total and the checkpoint, proceed — no plan. |
| Over budget, natural boundaries exist | Slice plan: each slice within budget, buildable alone, ordered by dependency. STOP for confirmation. |
| Over budget, grouping by layer/domain collapses to one bucket (indivisible logic, generated code, migration) | Flag `size:exception` up front with rationale; STOP for user decision. |
| Every slice builds and merges alone | Ask; recommend Stacked PRs to base. |
| A slice cannot stand alone until the chain completes | Ask; recommend Feature Branch Chain with draft tracker. |
| Estimate range straddles the budget | Plan slices (Hard Rule; never average into a pass). |
| Implementation already began | Measure the real diff; gate on real + forecast combined; over budget, existing diff → `slice-diff`, remainder → slice plan. |
| An item cannot be estimated | Verdict `unestimable`: report which items, why, and what input would unblock; STOP for user decision. Never fabricate a number to reach another verdict. |

## Execution Steps

1. List every file or area the change touches (create / modify / delete). Read enough of each to ground the estimate — do not implement anything.
2. Estimate per item with its range and basis; sum the total.
3. Apply the decision gates.
4. Over budget: define slices — contents (files, planned commits), estimated lines, order, what each depends on, and each slice's base.
5. Over budget: derive the strategy recommendation from the dependency column and present both options for the user to choose.
6. Present the plan (or the single-unit total) with the overrun checkpoint embedded, and STOP when a gate requires confirmation.
7. On confirmation of BOTH the plan and the strategy, implementation follows the plan slice by slice, commits scoped to the current slice; the implementer opens each slice's PR in plan order on its planned base, under the chosen strategy. `slice-diff` enters only if a cut diff is itself oversized.

## Output Contract

Return the active budget and its source (`default 400` or the user's explicit number), the itemized forecast table (item, estimated range, basis) and the total, then the verdict: `single unit` (within budget), `slice plan`, `size:exception`, or `unestimable`. For a slice plan, add the resolved base, a per-slice table — slice name, contents, estimated lines, depends-on, base — the implementation order, and a delivery-strategy block offering Stacked PRs to base and Feature Branch Chain with one recommended and its dependency-signal rationale. Every emitted plan or single-unit verdict MUST embed this checkpoint exactly, substituting only `<budget>` with the active number, so the guard — and the budget itself — travel with the artifact into sessions where this skill is no longer loaded: "Before each commit, run `git diff --stat <base>`; if the current work unit — slice or single unit — exceeds <budget> real changed lines, stop: hand the accumulated diff to `slice-diff` (budget <budget>) and re-forecast the remainder with `slice-plan` (budget <budget>)." STOP before any implementation when a plan, exception, or `unestimable` verdict is on the table; a slice plan resumes only once the user has confirmed the plan AND chosen a strategy.

## References

- [../slice-diff/SKILL.md](../slice-diff/SKILL.md) — the after-the-fact sibling: measurement, cut priority, and execution for a diff that already exists.
- [../slice-diff/references/slicing-details.md](../slice-diff/references/slicing-details.md) — "Resolving the Base" (fallback chain) and "Choosing the Strategy" (Stacked PRs vs Feature Branch Chain definitions).
