---
name: review-6-lens
description: "Trigger: review a branch, PR, commits, tag, merge, or WIP diff; \"review since X\"; \"6-lens review\". Reviews a diff across 6 isolated lenses (Risk, Readability, Reliability, Resilience, Architecture, Spec), reported by severity."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: 1.3.0
---

Review a diff through **6 isolated read-only lenses** (Risk, Readability, Reliability, Resilience, Architecture, Spec), then aggregate by severity without merging.

## Hard Rules

- Read-only. Report findings; never edit code.
- Validate the ref and a non-empty diff BEFORE dispatching any lens. Bad ref or empty diff fails here.
- Run each lens in **isolation** — no lens sees another's context or findings. Prefer parallel isolated sub-agents (one per lens); else sequential with reset context. Never let one lens bias another.
- The aggregate orders by severity but never lets one lens alter another's: no finding dropped, reworded, softened, or absorbed because a different lens saw the same code. Each keeps its lens label and verbatim text. Two lenses, one issue → two findings.
- The verdict is **derived, not editorial**: references existing findings by number, in the severities the lenses actually emitted (never invent a 🔴 if the worst is 🟠). It guides the merge call; it may not silence, downgrade, or overrule a lens.
- **Causality**: each code-lens finding is classified by changed-region membership (`references/dispatch.md` step 4); `introduced` is the safe default, `pre-existing` needs positive evidence it sits outside the diff. Only `pre-existing` is non-blocking — it moves to the follow-up section (the sole exception to no-move; severity never downgraded). Spec is exempt.
- Every finding needs `severity` + lens + file + evidence + concrete `Fix`. No evidence → not a finding. `Why it matters` is the mechanism (how it breaks); `Fix` is the action (what to do) — separate fields, never folded.
- A lens with nothing to report says exactly `No findings.`

## Decision Gates

**Fixed point** — whatever the user names (SHA, branch, tag, `main`, `HEAD~5`, merge-base). For uncommitted work, use `git diff HEAD`. None given → ask.

**Spec source** — resolve in order, ask only once, normalize to text:

| Source | Action |
|--------|--------|
| Argument (path or pasted text) | Use it. |
| Repo file matching branch/feature (`docs/`, `specs/`) | Use it; report which. |
| URL | Fetch it. On failure, **notify the user**; fall back to pasted text or skip. |
| Nothing found | Ask once: paste intent / path / URL / no spec. |
| No spec at all | Skip the Spec lens (report "no spec available"); run the other five. |

## Execution Steps

1. Fix `<diff-cmd>` **once** — `git diff <point>...HEAD` (3-dot = vs merge-base) for a committed range, `git diff HEAD` uncommitted — and reuse it for every derivation so regions always match the reviewed diff. From it: the diff + `git log <point>..HEAD --oneline`; `<N>` (changed-line count, `<diff-cmd> --shortstat`, gates sweep depth); and `<changed-hunks>` (per-file changed regions, `<diff-cmd> --unified=0`, gates causality). Build `<changed-hunks>` per `references/dispatch.md` — compact form, per-file size cap, and the empty-while-diff-non-empty fail-safe all specified there.
2. Validate: ref resolves (`git rev-parse`) and the diff is non-empty. Else stop.
3. Resolve the spec (Decision Gates); normalize to text.
4. Dispatch the 6 lenses as isolated reviews per `references/dispatch.md`. Skip Spec if no spec.
5. Aggregate per Output Contract. Do not merge.

## Output Contract

Aggregate by **severity**, not lens (each finding keeps its lens tag). Build the report per `references/output-contract.md`, in order: (1) human lead, (2) `introduced` findings under `##` severity headings 🔴→🟠→🟡→🔵 numbered continuously, (3) optional `## 📝 Pre-existing (follow-up)` for `pre-existing` findings (reported, non-blocking), (4) optional `## ✅ Verified OK`, (5) clean-lenses line, (6) optional `## Verdict` (derived, not editorial; counts only `introduced`), (7) summary line `Risk n (emoji) | …`. Findings use the `finding-shape.md` shape.

## References

- `dispatch.md` — how to build each lens's prompt.
- `finding-shape.md` — the per-finding shape + aggregation rules.
- `output-contract.md` — how to assemble the final report.
- `review-{risk,readability,reliability,resilience,architecture,spec}.md` — the L1–L6 lens rules (one file each).
