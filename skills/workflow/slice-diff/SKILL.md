---
name: slice-diff
description: "Trigger: a diff too big to review. Slices an oversized git diff into a chain of reviewable PRs, then executes on confirmation. Use whenever one change should ship as several: 'split this PR', 'chain these PRs', a reviewer complains about size, a 1500-line branch about to become one PR. Sizing work before code exists → slice-plan; reviewing the diff's content → review-6-lens."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.3"
---

## Activation Contract

Load this skill when a diff over a git range (`<base>...HEAD`, a tag, or a branch) may exceed the review budget (default **400 changed lines**), or the user asks to split a PR, cut review slices, chain/stack PRs, or reduce reviewer load. Operate on git alone — `git diff`, `git log`, `git diff --stat` are the only sources of truth. Do not read external forecasts, planning config, or delivery strategy.

## Hard Rules

- Resolve the base branch from git via the fallback chain, never assume `main`; if it cannot resolve, STOP and ask. `main` here is an illustrative placeholder. See references → "Resolving the Base".
- The review budget defaults to **400 changed lines** (`additions + deletions` over the range, binary files excluded) and is the hard gate: over it, split unless the user accepts `size:exception`. Use a different number ONLY when the user names one explicitly — in the invocation ("budget 800") or written in project context (CLAUDE.md/AGENTS.md). NEVER infer a budget from repo size, history, or diff feel, and never adjust it mid-run; no explicit number → 400. The active budget replaces 400 everywhere in this skill. See references → "Measuring the Range".
- Use domain/layer only as a soft signal for WHERE to cut, never as a second blocking gate; infer it from path segments, no config file. When grouping collapses to one bucket, fall through to `size:exception`.
- Keep each PR one deliverable work unit that builds independently; the active budget is the binding gate (a ~≤60-minute review is a non-binding heuristic under it).
- Screen the range for merge commits before cutting; if any exist, cut by `--first-parent` or path — never naively cherry-pick a merge (it silently drops a parent's changes). See references → "Cut Priority".
- SHOW the full cut plan and STOP for explicit user confirmation before any mutation. Never create branches, cherry-pick, push, or open PRs before confirmation.
- Re-validate git state immediately before executing. If dirty or diverged, do not loop: report the concrete blocker and STOP, asking the user to reconcile. See references → "State Re-Validation".
- On any mid-execution failure, STOP before further mutation and never force past it; report what exists and offer resume-vs-teardown. See references → "Mid-Execution Failure".
- Every child PR states its position, base, and dependency, plus a diagram marking the current PR with `📍`. See references → "Chain Context Section".
- Always ask the user to pick the chain strategy — never auto-select; recommend one from git-detected slice autonomy. Do not mix strategies after one is chosen. See references → "Choosing the Strategy".

## Decision Gates

Terms ("focused", "splits cleanly") are defined in references → "Cut Priority".

| Condition | Action |
|---|---|
| Range within budget and focused | Keep single PR. |
| Over budget, commits split cleanly under it | Cut by commit boundaries. |
| A single commit alone exceeds the budget | Subdivide that commit by layer/domain paths. |
| Cannot split into independent units (generated/vendor/migration or indivisible authored logic) | Mark `size:exception`, do not force. |
| Each slice builds/merges alone (autonomous) | Ask; recommend Stacked PRs to base. |
| A slice cannot stand alone until the chain completes | Ask; recommend Feature Branch Chain with draft tracker. |

## Execution Steps

1. Resolve the base branch (references → "Resolving the Base"). If the repo is shallow (`git rev-parse --is-shallow-repository` = true), warn and recommend `git fetch --unshallow` before trusting any budget. Then measure the range (references → "Measuring the Range").
2. Cut by the priority order (references → "Cut Priority"); keep each PR under the budget.
3. Present the plan: PRs, files/commits per PR, order, dependencies, per-PR review budget. STOP.
4. On confirmation, re-validate git state; if diverged or dirty, report the concrete blocker and STOP — do not recompute or loop.
5. Execute the chosen strategy only. If the user chose Stacked for non-autonomous slices, warn a slice may land broken before proceeding. Create branches, cherry-pick, push, open PRs with Chain Context.
6. Verify each PR independently: CI/tests/docs, rollback scope, clean diff showing only its unit.

## Output Contract

Before confirmation, return the cut plan: chain strategy, PR order, files/commits per PR, dependency diagram (`📍` on the current PR), per-PR review budget (`additions + deletions`), and any `size:exception` rationale. After execution, return the created branches/PRs and each PR's verification result.

## References

- [references/slicing-details.md](references/slicing-details.md) — measurement commands, strategy diagrams, PR Chain Context section, and execution/verification detail.
