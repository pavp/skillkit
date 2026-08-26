# Slice-Diff Details

`<base>` is the resolved base branch, not literally `main`. The `main` in the diagrams below is an illustrative example — substitute the resolved base.

## Resolving the Base

`git symbolic-ref refs/remotes/origin/HEAD` fails on single-branch clones, repos where `origin/HEAD` was never set, and repos with no `origin`. Never rely on it alone. Try in order:

```bash
# 1. user-named base wins
git symbolic-ref --quiet refs/remotes/origin/HEAD   # 2. strip refs/remotes/origin/ prefix
git remote show origin | sed -n 's/.*HEAD branch: //p'  # 3. network; authoritative
git rev-parse --verify origin/main                  # 4. probe common defaults
git rev-parse --verify origin/master
```

If none resolve, STOP and ask the user for the base. Never assume `main`.

## Measuring the Range

```bash
git diff --stat <base>...HEAD          # 3-dot: what THIS branch adds vs the merge base
git log --oneline <base>..HEAD         # 2-dot: commits unique to HEAD = cut candidates
git diff --numstat <base>...HEAD       # additions/deletions per file
```

The 3-dot in `diff` (vs merge base) and 2-dot in `log` are intentional and must not be normalized to match — 2-dot `diff` would fold in changes that landed on `<base>` after the branch point and inflate the budget.

Binary files emit `-\t-\t<path>` in `--numstat`. Never coerce `-` to 0: exclude those rows from the `additions + deletions` sum and surface them as "N binary files" in the plan. Flag the binaries themselves for `size:exception` (they are indivisible) — this does not push the surrounding source PR to exception when its own line sum is under budget.

Shallow clone (`git rev-parse --is-shallow-repository` = true): the merge base may lie beyond the grafted boundary, so the budget and boundaries are silently wrong. Warn and recommend `git fetch --unshallow` before trusting any measurement.

Domain grouping: take the first path segment after conventional container prefixes (`src`, `packages`, `apps`, `lib`) — e.g. the domain of `packages/core/src/auth/x.ts` is `auth`. Files sharing that segment are one domain. A flat/unconventional layout, or a grouping that collapses to one bucket, weakens this signal — fall back to commit boundaries, then to `size:exception`.

## Cut Priority

Terms used in the Decision Gates: a range is **focused** when its files share one leading path segment; commits **split cleanly** when they map to slices with no hunks crossing a cut point.

1. **By commit boundary.** Group existing commits into PRs up to the active budget (default 400 changed lines) each, preserving order and dependencies. First screen the range: `git log --merges <base>..HEAD` — if non-empty, frame with `--first-parent` or cut by path instead (cherry-picking a merge needs `-m <parent>`). Collapse revert pairs (commit + its later revert) before budgeting so they don't double-count. A cut is valid only if each slice builds independently; if a later commit fixes an earlier one across a cut point, keep them together or fall to step 2.
2. **By layer/domain.** Only when a single commit alone exceeds the budget: subdivide that commit's hunks by the path segments above (e.g. types → logic → ui → tests, or `auth` vs `db`). If this collapses to one bucket or no slice drops under budget, fall to step 3 or cut mechanically by file/hunk count.
3. **size:exception.** Any diff that cannot split into independent reviewable units — generated/vendor/migration or genuinely indivisible authored logic: keep as one PR, label `size:exception`, state why.

## State Re-Validation

```bash
git status --porcelain                 # empty = clean tree; non-empty = blocked
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null   # upstream? or empty
git rev-list --left-right --count @{u}...HEAD   # run ONLY if an upstream exists
```

`@{u}` is undefined on a branch with no upstream — exactly the state of a freshly created slice branch. Guard first: no upstream → treat as "not diverged" (nothing to diverge from); run the left-right count only when an upstream is present.

If the tree is dirty or the branch diverged since the plan, do not loop recompute. Report the concrete blocker — the `git status --porcelain` files or the divergence counts — and STOP, asking the user to stash/commit/reconcile before re-invoking.

## Mid-Execution Failure

Execution mutates in sequence (branches → cherry-pick → push → PRs). On any failure partway through a chain:

- **Cherry-pick conflict:** stop, surface the conflicting files, never force past it.
- **Rejected push or forge-client error:** stop before creating further PRs.

Then report which branches/PRs already exist and offer the user a choice: resume from the failed step, or tear down the created branches/PRs. Keep steps ordered so a resume does not duplicate existing branches or PRs.

A grouping call that fails, or a missing client, is not one of those failures: the PRs are already chained and complete. Report the chain as ungrouped and finish — never offer teardown over it.

## Choosing the Strategy

Never auto-select. Always present both and let the user choose; the skill's job is to recommend, not decide — the pick is often a team convention (speed-first vs. coordinated release), not a purely technical call.

Detect slice autonomy from git: does each slice build and merge on its own, or does a later slice depend on an earlier one to be functional?

- **Autonomous slices** → recommend **Stacked PRs to base** (simplest, each ships in order).
- **Not autonomous** (a slice would land broken until the chain completes) → recommend **Feature Branch Chain**. Here Stacked is not just weaker — it is unsafe: merging slice 1 alone breaks or half-ships the feature. If the user still picks Stacked, warn them of that consequence before executing; do not silently comply.

Grouping the chain into a native stack (see "Native Stacks") does not lift that warning. A stack merges a PR together with every unmerged PR below it, which forecloses an upper slice landing without its dependencies — but merging slice 1 by itself stays available, and that is the hazard the warning names. Recommend on autonomy alone, and never let grouping decide the strategy.

## Strategy Notes

| | Stacked PRs to base | Feature Branch Chain |
|---|---|---|
| Speed | Each slice ships in order | Full feature waits for tracker merge |
| Rollback | Revert individual base-branch PRs | Revert/hold the whole feature branch |
| Risk | Partial behavior may land | Nothing lands until the chain completes |
| Complexity | Simpler retarget/rebase | Requires tracker and strict diff hygiene |

The Risk and Complexity rows describe an ungrouped chain. Grouped into a native stack, Stacked's retarget cost drops to zero and no slice can land ahead of the slices below it — but the bottom PR still merges alone, so the Risk row's partial landing survives.

## Feature Branch Chain

Use when the feature branch accumulates the final integration while child PRs are reviewed as focused slices.

```text
main
 └── feat/my-feature              ← tracker/final integration branch
      ↑ PR #1 base: feat/my-feature
      └── feat/my-feature-01-core
           ↑ PR #2 base: feat/my-feature-01-core
           └── feat/my-feature-02-shared
                ↑ PR #3 base: feat/my-feature-02-shared
                └── feat/my-feature-03-slice
```

Steps:

1. Create the feature/tracker branch from the resolved base branch.
2. Open the tracker PR to the base branch; mark it draft/no-merge.
3. Create PR #1 from a child branch and target it to the tracker branch.
4. Create each later child branch from the previous PR branch and target it to that parent branch.
5. Merge/integrate children in order; merge the tracker only after the chain is complete.

## Stacked PRs to Base

Use when each slice can land on the base branch in order (`main` in the diagram is illustrative).

```text
main <- PR 1: foundation
          └── PR 2: feature slice built on PR 1
                └── PR 3: docs/tests built on PR 2
```

After a parent PR merges, rebase/retarget the next PR so it shows only the current slice — unless the chain was grouped into a native stack, which retargets the next PR itself.

The diagram is always nested (each PR branches off the previous PR's branch), even when the slices are logically independent — the nesting reflects the branch chain, not a code dependency. A flat diagram (every PR hanging off the base) is a different strategy (independent PRs to base), not Stacked; do not draw it that way when the chosen strategy is Stacked.

## Chain Context Section

Append this to the PR body; never replace the repo's PR template. Keep it to what a reviewer needs to see the slice in its chain — position, base, and dependency. The diagram carries the rest (previous/next PRs); the diff and the repo template carry scope and checklists, so do not duplicate them here.

````markdown
## Chain Context

Position: <N of total> · Base: `<target branch>` · Depends on: <#NNN or "None">

```text
<base>
 └── #NNN Previous PR
      └── 📍 #NNN This PR
           └── #NNN Next PR
```
````

## Commands

Each row is a capability the execution needs; the command column is one forge's instance of it. On another forge, substitute its equivalent — the steps do not change.

| Capability | GitHub (`gh`) |
|---|---|
| Measure an existing PR | `gh pr view <PR_NUMBER> --json additions,deletions,changedFiles,title,url` |
| Open a PR targeting the previous slice's branch | `gh pr create --base <parent-branch> --title "feat(scope): focused slice" --body-file pr-body.md` |
| Probe the stack capability | `gh extension list` → a `gh stack` row |
| Check the chain is single-repository | `gh pr view <PR_NUMBER> --json headRepositoryOwner` |
| Group the chain into a native stack | `gh stack link <bottom-pr> <…> <top-pr>` |
| Enable the capability (report, never run) | `gh extension install github/gh-stack` |

## Native Stacks

A forge that groups a PR chain into a first-class stack retargets and merges it for you. GitHub does; it requires the `gh-stack` extension (`gh extension list` → `gh stack`) and all branches in one repository.

`gh stack link` takes the already-created PRs bottom-to-top and groups them without touching branches, commits, or bases — run it after the last PR is open, never instead of creating them. Read back which PRs it actually covers and report that; a call that fails or covers only some of them leaves the rest ungrouped, never "grouped".

Group under Stacked only. A Feature Branch Chain holds its tracker PR draft until the chain completes, and a stack would merge that tracker along with any PR above it — the one thing that strategy exists to prevent.

Its absence costs only the grouping: the PRs stay chained and reviewable exactly as this skill builds them. Report it and continue; never install the client yourself — name the command and let the user decide.

## Verification

- Each PR's diff shows only its own work unit; a polluted diff is a branching bug — retarget or rebase.
- Each PR can roll back without touching unrelated changes.
- CI, tests, or manual checks cover the unit the PR delivers.
- Review child PRs against their immediate parent branch.
```
