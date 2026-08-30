---
name: slice-plan
description: "Trigger: sizing work BEFORE coding it. Forecasts changed lines and, over the budget (default 400), plans slice boundaries and how they ship — stacked PRs or a feature branch chain. Use whenever implementation is about to start unsized, or planned slices need a delivery call: 'plan this feature', 'will this fit one PR', 'stacked or chained?'. Diff already too big → slice-diff."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.5"
---

## Activation Contract

Load this skill when an implementation is about to start and its size is unplanned — before code exists. Forecast the changed lines of the whole change; over the review budget (default **400**), plan slice boundaries first so commits are born ordered by slice. This skill plans only: it never writes implementation code and never mutates git. Splitting a diff that is already oversized → `slice-diff`.

## Hard Rules

- Forecast BEFORE the first edit. If implementation already began, measure the real diff (`git diff --stat` against the base, resolved per the base rule below; here an unresolved base IS a STOP, since the measurement depends on it) and apply the gate to the COMBINED total: real lines + remainder forecast. Over the budget combined, the existing diff routes to `slice-diff` and the remainder gets a slice plan — never judge the halves separately. When the remainder is zero — every item asked for is already written — there is nothing left to forecast: return the verdict `already implemented`, hand the measured diff to `slice-diff`, and plan nothing. Describing cuts through code that already exists is measurement, not forecasting, and belongs to the sibling that can read it.
- The forecast MUST be itemized: every file or area to touch, its own estimated `additions + deletions` as a low–high range, and a one-line basis (existing file size, a comparable past change, scope of a new file). A basis may be measured by you or stated by the user — a line count the user supplies is valid, and greenfield work often has no other. Range every item; drop to a point estimate only when a measured comparable makes the range meaningless (an identical generated file, a mechanical rename). A single unbacked total is not a forecast — itemize it or declare `unestimable`.
- The review budget defaults to **400 changed lines** (binaries excluded) — the same budget `slice-diff` enforces after the fact, so plan and remedy agree. Use a different number ONLY when the user names one explicitly: in the invocation ("budget 800"), or in the project's agent-instruction files (AGENTS.md or the runtime's equivalent) explicitly designated as the PR/review size budget — a stray line count is not a budget; when non-default, quote the exact source line in the output. Invocation beats project context. NEVER infer a budget from repo size, history, or task feel, and never adjust it mid-run; no explicit number → 400. A named budget must be a positive integer; under 50 or over 5000, restate it and STOP for confirmation before applying. Read every "budget" in this skill as the active number, including in the embedded checkpoint.
- Gate on the HIGH end of a range, never the average — for the total and for each slice alike. Over budget means **strictly above** the active number; landing exactly on it passes. A total over budget plans slices; a slice over budget is cut further, and if it cannot be, it carries a stated re-forecast trigger and the reason it resisted cutting.
- Each slice is one deliverable work unit that builds and passes tests on its own, sliced along natural boundaries (layer, domain, feature); order slices so each depends only on earlier ones. Infer those boundaries from planned path segments, no config file. Domain/layer decides WHERE to cut, never WHETHER to: under the budget it never justifies slicing. Over it, a collapsed grouping is evidence toward `size:exception`, never a verdict on its own.
- A slice plan needs a base; a forecast does not. A base the user names — in the invocation or as the repo's stated default branch — IS the base; take it and never re-ask. The base need not be the default branch: when the checkout sits on a non-default branch that already carries work (`git rev-parse --abbrev-ref HEAD` is not the default and `git log <default>..HEAD` is non-empty), name both candidates once — that branch and the default — and let the user pick, since slicing onto a live feature branch is a real intent this skill cannot infer. Under `Chain` on such a base, reuse that branch as the tracker instead of creating a second one under it; a tracker beneath a tracker holds the same work twice. Otherwise resolve it per references → "Resolving the Base", skipping its network step so planning never blocks on the network, and never assume `main` unless git answers it. When git answers for a repo that is not the one being planned (the forecast's paths are absent from it), that answer does not count — report `unresolved`. Unresolved is not a STOP: emit the forecast, total, and verdict anyway, report the base as `unresolved` (or `not a git repo`), and ask for it before stating any slice's base. On a shallow repo (`git rev-parse --is-shallow-repository`), warn that a diff measured against that base is untrustworthy and recommend `git fetch --unshallow`.
- On a slice plan, ASK the user to pick the delivery strategy — never auto-select. Recommend one by judging **shippability** (does the slice deliver behavior a user can reach?), not the buildability every slice already has: every slice shippable alone → **Stacked PRs to base** (each merges into the base in order); any slice that lands unreachable code until a later slice arrives → **Feature Branch Chain** (slices target a draft tracker branch, nothing lands until the chain completes). Label the two options literally `Stacked` and `Chain`, and accept only an answer that matches exactly one label unambiguously; on an ambiguous answer, or one matching neither, re-emit the delivery-strategy block and ask again — NEVER infer the choice, since inferring Stacked where Chain was meant merges slice 1 alone and ships broken behavior. If the user overrides a Feature Branch Chain recommendation and picks Stacked, warn that merging slice 1 alone lands broken or half-shipped behavior before proceeding — never silently comply. Do not mix strategies after one is chosen. Elaboration: references → "Choosing the Strategy".
- Native grouping imposes ONE linear order on the PRs it groups: it rewrites each PR's base to the one before it. Group only when the depends-on column is already that single line — every slice depending on its immediate predecessor. When two slices share a parent, the plan is a tree, and grouping would reparent a slice onto a branch that does not contain what it builds on, re-showing that slice's files and inflating its diff past the budget this skill exists to hold. Grouping is also sticky: a grouped PR refuses `--base` edits until the stack is dissolved, so a wrong grouping costs more to undo than to skip.
- Every slice plan MUST carry one native-grouping line, whose exact shape the Output Contract defines. Under `Stacked` with a linear depends-on chain it states the chain is grouped once the last slice's PR is open — never in place of opening them — after which merging any PR takes every unmerged PR below it. Under `Stacked` with a tree, and under `Chain`, it states the chain is NOT grouped and why — for `Chain`, because a stack would merge the draft tracker the strategy exists to hold back. Grouping is planned intent, never an accomplished fact: the implementer reads back each PR's base and diff after the call and reports what they observed, since a PR whose diff grew is mis-grouped, and anything short of every PR grouped is ungrouped.
- Describe every forge action as the capability it needs, never as one vendor's CLI; the Commands table holds one forge's instance, and on a forge with no native stacking the grouping line says so — slices and bases do not change. At plan time, probe only the client capability (Commands); the single-repository check needs open PRs, so the line carries it as a precondition the implementer verifies. Name the enabling command, never run it. Absence costs only the grouping — the slices stay correct and reviewable as planned; report it and continue, never STOP for it.
- Never invent ceremony under the budget: forecast within budget → return the Output Contract's single-unit form (itemized forecast, total, verdict, checkpoint — the itemization is never optional) and let implementation proceed as one unit. No slice plan, no strategy question, no confirmation stop.
- Over the budget: SHOW the slice plan (or the `size:exception` / `unestimable` verdict with its rationale) and STOP for explicit user confirmation before implementation starts.

## Decision Gates

| Situation | Action |
|---|---|
| Checkout sits on a non-default branch carrying work | Name that branch and the default as base candidates; ask once. Under `Chain`, the chosen feature branch IS the tracker — never nest a new one under it. |
| Total within budget | Single work unit. Return the itemized forecast, total, verdict, and checkpoint; proceed — no plan, no strategy question, no stop. |
| Over budget, natural boundaries exist | Slice plan: each slice within budget, buildable alone, ordered by dependency. STOP for confirmation. |
| Over budget, no independent boundaries — grouping by layer/domain/feature collapses to one bucket AND no cut by planned commit or file count drops a slice under budget (indivisible logic, generated code, migration) | Flag `size:exception` up front with rationale; STOP for user decision. |
| Slice plan, every slice ships reachable behavior alone | Ask; recommend Stacked PRs to base. |
| Slice plan, a slice lands unreachable code until a later one arrives | Ask; recommend Feature Branch Chain with draft tracker. |
| A range's high end is over budget | Total → plan slices. A single slice → cut it further; if it resists, state its re-forecast trigger and why. Never average into a pass. |
| Implementation already began, work remains | Measure the real diff; gate on real + forecast combined; over budget, existing diff → `slice-diff`, remainder → slice plan. |
| Implementation already began, nothing remains | Verdict `already implemented`: report the measured total and route the diff to `slice-diff`. Emit no slice plan, no strategy question — there is nothing left to forecast. |
| The chain will not be grouped natively (Chain strategy, two slices sharing a parent, no client capability, or no native stacking on the forge) | State it in the plan with the enabling command; the slices stand as planned. Never STOP, never re-plan. |
| An item cannot be estimated | Verdict `unestimable`: report which items, why, and what input would unblock; STOP for user decision. Never fabricate a number to reach another verdict. |

## Execution Steps

1. List every file or area the change touches (create / modify / delete). Ground each estimate on what you can read; where the code is unwritten or lives outside this repo, the user's stated sizes are the basis. Do not implement anything.
2. Estimate per item with its range and basis; sum the total.
3. Apply the decision gates.
4. Slice plan: define slices — contents (files, planned commits), estimated lines, order, and what each depends on. A forecast item covering several slices (a test suite, a shared config) splits across them in proportion to the code each slice carries; state that split, since it decides whether a slice is over budget.
5. Slice plan: derive the strategy recommendation from the dependency column and present both options for the user to choose. Each slice's base follows from that choice, so state it only once the user has picked.
6. Present the plan (or the single-unit total) with the overrun checkpoint embedded, and STOP when a gate requires confirmation.
7. On confirmation of the plan — and, on a slice plan, of the strategy — probe the stack capability (Commands), then restate the slice table with each slice's resolved base and the table's one native-grouping line, then implementation follows it slice by slice, commits scoped to the current slice; the implementer opens each slice's PR in plan order on its stated base. `slice-diff` enters only if a cut diff is itself oversized.


## Output Contract

**Every verdict** returns the same base form, and the checkpoint below. Nothing about being under budget shortens it:

- the active budget and its source (`default 400` or the user's explicit number);
- the itemized forecast table — item, estimated range, basis. A measured comparable may collapse the range to a point estimate (Hard Rules); measured real lines carry `measured` as their basis and need no range;
- the total;
- the verdict — `single unit`, `slice plan`, `already implemented`, `size:exception`, or `unestimable`.

**A slice plan** adds, in this order:

- One per-slice table of the FINAL slices — slice name, contents, estimated lines, depends-on. One table only: a slice cut for going over budget gets a one-line note under it carrying what it held and its estimate ("channels bundled email+push+sms at 285–435, cut at the budget"), so the cut is legible without a second table.
- The implementation order.
- A delivery-strategy block offering `Stacked` (Stacked PRs to base) and `Chain` (Feature Branch Chain) under those exact labels, one recommended and justified by which slices ship reachable behavior alone — never by the depends-on column, which shows order and not reachability.

**Once the user picks**, restate that table with a `branch` and a `base` column, both holding real branch names, never prose:

- Name every branch — `feat/<change>` for the tracker, `feat/<change>-<n>-<slug>` per slice — unless the user names their own, or the base is itself a live feature branch, which becomes the tracker under `Chain` and keeps its own name.
- Under Stacked, a slice with no depends-on bases on the resolved base; one that depends on earlier slices bases on the LAST of them. A slice cannot base on a branch missing the code it builds on, so "Stacked" governs where the chain merges, never a promise that every base is the resolved base.
- Under Chain, slice 1 bases on the tracker and each later slice on the previous slice's branch.

**The restated table carries exactly one native-grouping line**, and this contract is its only authority. Spell its commands out in the line itself — it travels into sessions where this skill and its Commands table are gone, so a pointer there resolves to nothing. State it in the artifact, never only in conversation.

| Case | The line states |
|---|---|
| Stacked · capability present · every slice depends on its immediate predecessor | Once the last slice's PR is open, group with `gh stack link <bottom-pr> … <top-pr>`; merging any PR then takes every unmerged PR below it. Plus: every branch must live in ONE repository, and the implementer reads back each PR's base and diff and reports that, never the attempt — a PR whose diff grew is mis-grouped, and `gh stack unstack <stack>` must dissolve the stack before any base can be corrected. |
| Stacked · two slices share a parent | NOT grouped: grouping would force those siblings into one line and inflate the reparented slice's diff with another slice's files. |
| Stacked · capability absent | NOT grouped; `gh extension install github/gh-stack` would enable it; the slices stand as planned. |
| Chain | Never grouped: a stack would merge the draft tracker. |

**Every emitted plan or single-unit verdict** MUST embed this checkpoint exactly, substituting `<budget>` with the active number and `<base>` with the base that work unit targets, since a placeholder cannot resolve itself in a later session. Emit the body ONCE; when slices target different bases, follow it with one line per slice naming that slice's base — never repeat the whole checkpoint per slice. The guard, the budget, and the base travel with the artifact into sessions where this skill is no longer loaded:

> Before each commit, run `git diff --stat <base>`; if the current work unit — slice or single unit — is over <budget> real changed lines, stop: hand the accumulated diff to `slice-diff` (budget <budget>), then re-forecast every slice not yet started with `slice-plan` (budget <budget>) — a slice that overran invalidates the estimates that assumed its size, not just its own. Slices already merged stay as they are.

**STOP** before any implementation when a plan, exception, or `unestimable` verdict is on the table. A slice plan resumes only once the user has confirmed it AND chosen a strategy. If they confirm but decline to choose, say implementation stays blocked and re-ask once; never default to a strategy.

## Commands

Each row is a capability the plan hands to the implementer; the command column is one forge's instance of it. On another forge, substitute its equivalent — the slices and their bases do not change. `Run` says whether this skill may execute the row: only the read-only probe, which mutates nothing; every other row is named in the plan and executed later by the implementer.

| Capability | GitHub (`gh`) | Run |
|---|---|---|
| Probe the stack capability | `gh extension list` → a `gh stack` row | yes, at plan time |
| Check the chain is single-repository | `gh pr view <PR_NUMBER> --json headRepositoryOwner` | no — needs open PRs |
| Group the chain into a native stack (linear depends-on only) | `gh stack link <bottom-pr> <…> <top-pr>` | no — name it only |
| Dissolve a stack before correcting a base | `gh stack unstack <stack>` | no — name it only |
| Enable the capability | `gh extension install github/gh-stack` | no — name it only |

## References

- `slice-diff` — the after-the-fact sibling, installed separately: measurement, cut priority, and execution for a diff that already exists. Its references supply "Resolving the Base" (the fallback chain), "Choosing the Strategy" (elaboration on the two strategies), and "Native Stacks" (what grouping does to an existing chain, and why it is Stacked-only). **Absent →** resolve the base from git directly (`origin/HEAD`, then the checked-out default branch), report it `unresolved` if neither answers, present the two strategies from their one-line definitions in Hard Rules, and state grouping from the Commands table and the Hard Rules line; never invent strategy or grouping semantics.
