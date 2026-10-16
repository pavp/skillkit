---
name: slice-diff
description: "Trigger: a diff too big to review. Slices an oversized git diff into a chain of reviewable PRs, then executes on confirmation. Use whenever one change should ship as several: 'split this PR', 'chain these PRs', a reviewer complains about size, a 1500-line branch about to become one PR. Sizing work before code exists → slice-plan; reviewing the diff's content → review-6-lens."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.8"
---

## Activation Contract

Load this skill when a diff over a git range (`<base>...HEAD`, a tag, or a branch) may exceed the review budget (default **400 changed lines**), or the user asks to split a PR, cut review slices, chain/stack PRs, or reduce reviewer load. Operate on git alone for measurement — `git diff`, `git log`, `git diff --stat` are the only sources of truth. Do not read external forecasts, planning config, or delivery strategy; the sole non-git input is an explicitly named review budget (per Hard Rules).

## Hard Rules

- Resolve the base branch from git via the fallback chain, never assume `main`; if it cannot resolve, STOP and ask. `main` here is an illustrative placeholder. See references → "Resolving the Base".
- The review budget defaults to **400 changed lines** (`additions + deletions` over the range, binary and generated files excluded — lockfiles, snapshots, codegen output, surfaced as "N generated files" beside the binaries) and is the hard gate: over it — **strictly above** the active number; landing exactly on it passes — split unless the user accepts `size:exception`. Use a different number ONLY when the user names one explicitly — in the invocation ("budget 800", including one carried by a confirmed `slice-plan` checkpoint), or in the project's agent-instruction files (AGENTS.md or the runtime's equivalent) explicitly designated as the PR/review size budget — a stray line count is not a budget; when non-default, quote the exact source line in the output. Invocation beats project context. NEVER infer a budget from repo size, history, or diff feel, and never adjust it mid-run; no explicit number → 400. A named budget must be a positive integer; under 50 or over 5000, restate it and STOP for confirmation before applying. Read every "budget" in this skill as the active number. See references → "Measuring the Range".
- Use domain/layer only as a soft signal for WHERE to cut, never as a second blocking gate; infer it from path segments, no config file. When grouping collapses to one bucket, fall through to `size:exception`.
- Keep each PR one deliverable work unit that builds independently; the active budget is the binding gate (a ~≤60-minute review is a non-binding heuristic under it).
- Screen the range for merge commits before cutting; if any exist, cut by `--first-parent` or path — never naively cherry-pick a merge (it silently drops a parent's changes). See references → "Cut Priority".
- SHOW the full cut plan and STOP for explicit user confirmation before any mutation. Never create branches, cherry-pick, push, or open PRs before confirmation.
- Re-validate git state immediately before executing. If dirty or diverged, do not loop: report the concrete blocker and STOP, asking the user to reconcile. See references → "State Re-Validation".
- On any mid-execution failure, STOP before further mutation and never force past it; report what exists and offer resume-vs-teardown. See references → "Mid-Execution Failure".
- Describe every forge action as the capability it needs, never as one vendor's CLI; the command table in references → "Commands" holds the concrete instance.
- Under Stacked only, group the chain into a native stack after the last PR is open — never in place of creating them, and never under a Chain, whose draft tracker a stack would merge along with it. Grouping rewrites each PR's base to the one before it, imposing ONE line: group only when every PR already builds on its immediate predecessor. Two PRs sharing a parent make a tree — skip grouping and say so, since reparenting a PR onto a branch without what it builds on swells its diff with another slice's files. Probe the client for the capability and confirm every branch is in ONE repository (references → "Commands"); a forge offering stacks does not imply this checkout reaches them. Never install the client yourself. Read back each PR's base AND diff and report what you observed, not what you attempted; a grown diff is mis-grouped, anything short of every PR grouped is ungrouped, and correcting a base needs the stack dissolved first. Its absence leaves the chain already correct — report it, never STOP for it. See references → "Native Stacks".
- Always ask the user to pick the chain strategy — never auto-select. Recommend one by judging **shippability** (does the slice deliver behavior a user can reach?), not the buildability every slice already has: every slice shippable alone → Stacked PRs to base; any slice that lands unreachable code until a later slice arrives → Feature Branch Chain. Label the two options literally `Stacked` and `Chain`, and accept only an answer that matches exactly one label unambiguously; on an ambiguous answer, or one matching neither, re-emit the strategy choice and ask again — NEVER infer it, since inferring Stacked where Chain was meant merges slice 1 alone and ships broken behavior. Do not mix strategies after one is chosen. See references → "Choosing the Strategy".
- Name every branch `<prefix>/<change>` for the tracker and `<prefix>/<change>-<n>-<slug>` per slice. Take `<prefix>` from what the repo already does — the prefix its existing branches use for this kind of change (`git branch -a`), kind meaning the nature of the change, not its subject area — or failing that the type its commit messages give this kind of change. Never assume `feat`: a fix cut under `feat/` branches contradicts the convention the repo states elsewhere. With no signal either way, say which prefix you chose and why. A branch the user names wins over all of it.

## Decision Gates

Terms ("focused", "splits cleanly") are defined in references → "Cut Priority".

| Condition | Action |
|---|---|
| Range within budget and focused | Keep single PR. |
| Over budget, commits split cleanly under it | Cut by commit boundaries. |
| A single commit alone exceeds the budget | Subdivide that commit by layer/domain paths. |
| Cannot split into independent units (generated/vendor/migration or indivisible authored logic) | Mark `size:exception`, do not force. |
| Every slice ships reachable behavior alone | Ask; recommend Stacked PRs to base. |
| A slice lands unreachable code until a later one arrives | Ask; recommend Feature Branch Chain with draft tracker. |
| The chain will not be grouped natively (Chain strategy, two PRs sharing a parent, no capability, or cross-fork) | Report it in the plan; chain the PRs unchanged. Never STOP, never re-plan. |

## Execution Steps

1. Resolve the base branch (references → "Resolving the Base"). If the repo is shallow (`git rev-parse --is-shallow-repository` = true), warn and recommend `git fetch --unshallow` before trusting any budget. Then measure the range (references → "Measuring the Range").
2. Cut by the priority order (references → "Cut Priority"); keep each PR under the budget.
3. Present the plan: PRs, files/commits per PR, order, dependencies, per-PR review budget. Add one line on native grouping — that the chain will be grouped and merging any PR then takes every unmerged PR below it, or that it will not and why (client absent, quoting the enabling command from references → "Commands"; cross-fork; or a Chain). Informational, never a question or a gate. STOP.
4. On confirmation, re-validate git state; if diverged or dirty, report the concrete blocker and STOP — do not recompute or loop.
5. Execute the chosen strategy only. If the user chose Stacked over a Feature Branch Chain recommendation, warn that merging slice 1 alone lands broken or half-shipped behavior before proceeding; grouping does not lift that warning. Create branches, cherry-pick, push, open PRs, then group the chain (references → "Native Stacks").
6. Verify each PR independently: CI/tests/docs, rollback scope, clean diff showing only its unit.

## Output Contract

Before confirmation, return the cut plan opening with the active budget and its source (`default 400` or the user's explicit number, quoting its source line): the strategy choice offering `Stacked` (Stacked PRs to base) and `Chain` (Feature Branch Chain) under those exact labels, one recommended by shippability; the branch name per PR; PR order, files/commits per PR, dependency diagram, per-PR measured lines (`additions + deletions`), whether the chain will be grouped into a native stack, and any `size:exception` rationale. After execution, return the created branches/PRs, whether the chain was grouped into a native stack, and each PR's verification result.

## References

- [references/slicing-details.md](references/slicing-details.md) — measurement commands, strategy diagrams, and execution/verification detail.
