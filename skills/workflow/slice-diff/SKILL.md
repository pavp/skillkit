---
name: slice-diff
description: "Trigger: a diff too big to review. Slices an oversized git diff into a chain of reviewable PRs, then executes on confirmation. Use whenever one change should ship as several: 'split this PR', 'chain these PRs', a reviewer complains about size, a 1500-line branch about to become one PR. Sizing work before code exists → slice-plan; reviewing the diff's content → review-6-lens."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.4"
---

## Activation Contract

Load this skill when a diff over a git range (`<base>...HEAD`, a tag, or a branch) may exceed the review budget (default **400 changed lines**), or the user asks to split a PR, cut review slices, chain/stack PRs, or reduce reviewer load. Operate on git alone for measurement — `git diff`, `git log`, `git diff --stat` are the only sources of truth. Do not read external forecasts, planning config, or delivery strategy; the sole non-git input is an explicitly named review budget (per Hard Rules).

## Hard Rules

- Resolve the base branch from git via the fallback chain, never assume `main`; if it cannot resolve, STOP and ask. `main` here is an illustrative placeholder. See references → "Resolving the Base".
- The review budget defaults to **400 changed lines** (`additions + deletions` over the range, binary files excluded) and is the hard gate: over it, split unless the user accepts `size:exception`. Use a different number ONLY when the user names one explicitly — in the invocation ("budget 800", including one carried by a confirmed `slice-plan` checkpoint), or in the project's agent-instruction files (AGENTS.md or the runtime's equivalent) explicitly designated as the PR/review size budget — a stray line count is not a budget; when non-default, quote the exact source line in the output. Invocation beats project context. NEVER infer a budget from repo size, history, or diff feel, and never adjust it mid-run; no explicit number → 400. A named budget must be a positive integer; under 50 or over 5000, restate it and STOP for confirmation before applying. Read every "budget" in this skill as the active number. See references → "Measuring the Range".
- Use domain/layer only as a soft signal for WHERE to cut, never as a second blocking gate; infer it from path segments, no config file. When grouping collapses to one bucket, fall through to `size:exception`.
- Keep each PR one deliverable work unit that builds independently; the active budget is the binding gate (a ~≤60-minute review is a non-binding heuristic under it).
- Screen the range for merge commits before cutting; if any exist, cut by `--first-parent` or path — never naively cherry-pick a merge (it silently drops a parent's changes). See references → "Cut Priority".
- SHOW the full cut plan and STOP for explicit user confirmation before any mutation. Never create branches, cherry-pick, push, or open PRs before confirmation.
- Re-validate git state immediately before executing. If dirty or diverged, do not loop: report the concrete blocker and STOP, asking the user to reconcile. See references → "State Re-Validation".
- On any mid-execution failure, STOP before further mutation and never force past it; report what exists and offer resume-vs-teardown. See references → "Mid-Execution Failure".
- Every child PR states its position, base, and dependency, plus a diagram marking the current PR with `📍`. See references → "Chain Context Section".
- Describe every forge action as the capability it needs, never as one vendor's CLI; the command table in references → "Commands" holds the concrete instance.
- After the last PR is open, group the chain into a native stack; never in place of creating the PRs. Probe the client for the capability before planning on it — a forge that offers stacks does not imply this checkout can reach them, and cross-fork chains cannot be grouped at all. If it is absent the chain is already correct — report it, never STOP for it. See references → "Native Stacks".
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
| The forge cannot group the chain natively (no capability, or cross-fork) | Report it in the plan; chain the PRs unchanged. Never STOP, never re-plan. |

## Execution Steps

1. Resolve the base branch (references → "Resolving the Base"). If the repo is shallow (`git rev-parse --is-shallow-repository` = true), warn and recommend `git fetch --unshallow` before trusting any budget. Then measure the range (references → "Measuring the Range").
2. Cut by the priority order (references → "Cut Priority"); keep each PR under the budget.
3. Present the plan: PRs, files/commits per PR, order, dependencies, per-PR review budget. Detect whether the forge can group the chain natively and, when it cannot, add one line naming what the PRs lack and the command that would enable it — informational, never a question or a gate. STOP.
4. On confirmation, re-validate git state; if diverged or dirty, report the concrete blocker and STOP — do not recompute or loop.
5. Execute the chosen strategy only. If the user chose Stacked for non-autonomous slices, warn a slice may land broken before proceeding — unless the chain will be grouped natively. Create branches, cherry-pick, push, open PRs with Chain Context, then group the chain (references → "Native Stacks").
6. Verify each PR independently: CI/tests/docs, rollback scope, clean diff showing only its unit.

## Output Contract

Before confirmation, return the cut plan opening with the active budget and its source (`default 400` or the user's explicit number, quoting its source line): chain strategy, PR order, files/commits per PR, dependency diagram (`📍` on the current PR), per-PR measured lines (`additions + deletions`), and any `size:exception` rationale. After execution, return the created branches/PRs, whether the chain was grouped into a native stack, and each PR's verification result.

## References

- [references/slicing-details.md](references/slicing-details.md) — measurement commands, strategy diagrams, PR Chain Context section, and execution/verification detail.
