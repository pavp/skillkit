---
name: slice-plan
description: "Trigger: sizing work BEFORE coding it. Forecasts the changed lines of a planned implementation and, over 400, plans slice boundaries — which files and commits per slice — before any code exists. Use whenever implementation is about to start with no size plan: 'plan this feature', 'will this fit one PR', a ticket that smells bigger than one review. Diff already exists → slice-diff."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Load this skill when an implementation is about to start and its size is unplanned — before code exists. Forecast the changed lines of the whole change; over **400**, plan slice boundaries first so commits are born ordered by slice. This skill plans only: it never writes implementation code and never mutates git. Splitting a diff that already exists → `slice-diff`.

## Hard Rules

- Forecast BEFORE the first edit. If implementation already began, measure the real diff (`git diff --stat` against the base) and hand what exists to `slice-diff`; forecast only the remainder.
- The forecast MUST be itemized: every file or area to touch, its own estimated `additions + deletions`, and a one-line basis (existing file size, a comparable past change, scope of a new file). A single unbacked total is not a forecast — itemize it or report that you cannot estimate and why.
- Treat **>400 estimated changed lines** (binaries excluded) as the gate — the same budget `slice-diff` enforces after the fact. Estimation runs on the same currency so plan and remedy agree.
- When an estimate is uncertain and its plausible range crosses 400, plan slices; never average the range into a pass.
- Each slice is one deliverable work unit that builds and passes tests on its own, sliced along natural boundaries (layer, domain, feature); order slices so each depends only on earlier ones.
- Never invent ceremony under the budget: forecast ≤400 → state the total in one line and let implementation proceed as a single unit. No slice plan, no confirmation stop.
- Over the budget: SHOW the slice plan and STOP for explicit user confirmation before implementation starts.
- If mid-implementation the current slice's real diff exceeds its estimate and crosses 400 on its own, stop and re-forecast the remaining slices; the accumulated diff belongs to `slice-diff`, not to a silently stretched plan.

## Decision Gates

| Forecast | Action |
|---|---|
| Total ≤400 | Single work unit. State the total, proceed — no plan. |
| >400, natural boundaries exist | Slice plan: each slice ≤400, buildable alone, ordered by dependency. |
| >400, no independent boundaries (indivisible logic, generated code, migration) | Flag `size:exception` up front with rationale; single unit by user decision. |
| Estimate range straddles 400 | Plan slices. |

## Execution Steps

1. List every file or area the change touches (create / modify / delete). Read enough of each to ground the estimate — do not implement anything.
2. Estimate per item with its basis; sum the total.
3. Apply the decision gate.
4. Over budget: define slices — contents (files, planned commits), estimated lines, order, and what each depends on.
5. Present the plan and STOP for confirmation.
6. On confirmation, implementation follows the plan slice by slice, commits scoped to the current slice — each slice lands as its own PR (chaining an already-cut diff is `slice-diff`'s job).

## Output Contract

Return the itemized forecast table (item, estimated lines, basis) and the total, then the verdict: `single unit` (≤400), `slice plan`, or `size:exception`. For a slice plan, add a per-slice table — slice name, contents, estimated lines, depends-on — and the implementation order. STOP before any implementation when a plan or exception is on the table.
