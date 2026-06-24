---
name: review
description: "Trigger: review a branch, PR, commits, tag, merge, or WIP diff; \"review since X\"; \"6-lens review\". Reviews the diff across 6 isolated lenses — Risk, Readability, Reliability, Resilience, Architecture + Spec — reported separately."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: 1.0.0
---

Review the diff between `HEAD` and a fixed point through **6 independent, isolated read-only lenses**, then aggregate without merging.

- **HOW it's built** — Risk, Readability, Reliability, Resilience, Architecture.
- **WHAT was asked** — Spec: does the diff implement the originating intent?

The two axes are kept separate so one never masks the other.

## Hard Rules

- Read-only. Report findings; never edit code.
- Validate the ref and a non-empty diff BEFORE dispatching any lens. Bad ref or empty diff fails here.
- Run each lens in **isolation** — no lens sees another lens's context or findings. This is the only hard requirement on execution.
- Prefer parallel execution when the runtime offers isolated sub-agents (one per lens). If it does not, run the lenses sequentially, resetting context between each. Never let one lens's output bias another.
- Do NOT merge or rerank findings across lenses. No global "winner".
- Every finding needs `severity` + affected files + evidence. No evidence → not a finding.
- A lens with nothing to report says exactly `No findings.`

## Decision Gates

**Fixed point** — whatever the user names (SHA, branch, tag, `main`, `HEAD~5`, merge-base). For uncommitted work, use `git diff HEAD`. None given → ask.

**Spec source** — resolve in order, ask only once:

| Source | Action |
|--------|--------|
| Passed as argument (path or pasted text) | Use it. |
| Repo file matching branch/feature (`docs/`, `specs/`) | Use it; report which. |
| Nothing found | Ask once: paste intent / give path / give URL / no spec. |
| URL | Fetch it. On any failure (auth, network, 404) **notify the user** and fall back to pasted text or skip. |
| No spec at all | Skip the Spec lens; report "no spec available". Run the other four anyway. |

All sources normalize to text before reaching the Spec lens.

## Execution Steps

1. Resolve the fixed point and build the diff command once. Against a ref: `git diff <point>...HEAD` (three-dot = vs merge-base) + commits `git log <point>..HEAD --oneline`. For uncommitted work: `git diff HEAD` (no ref, no commit list).
2. Validate: for a ref, `git rev-parse <point>` resolves; in all cases the diff is non-empty. Else stop.
3. Resolve the spec via the Decision Gates table; normalize to text.
4. Dispatch the 6 lenses, each as an isolated review, building each prompt per `references/dispatch.md`. Skip Spec if no spec.
5. Aggregate (see Output Contract). Do not merge.

## Output Contract

Open with a 1–2 sentence human lead: what was reviewed (fixed point + file count) and the single worst thing found, in plain language. Then the structured report.

One `##` heading per lens, in order: Risk, Readability, Reliability, Resilience, Architecture, Spec. Under each, paste that lens's findings **verbatim** — never reformat, compress, or rerank. A clean lens shows `No findings.`; a skipped Spec shows `no spec available — lens skipped`. (Finding shape lives in the lens rules files; emoji map: 🔴 BLOCKER · 🟠 CRITICAL · 🟡 WARNING · 🔵 SUGGESTION.)

If every lens is clean, still emit the human lead ("Reviewed X; nothing flagged.") and each `##` heading with `No findings.` — never collapse to a bare "all good".

Close with a one-line summary — count per lens + worst severity WITHIN each lens, no cross-lens ranking:

```
Risk 3 (🔴) | Read 4 (🟡) | Reliab 3 (🔴) | Resil 3 (🔴) | Arch 1 (🟠) | Spec 2 (🟠)
```

## References

- `references/dispatch.md` — how to build each lens's prompt (skeleton, labels, rules-file map).
- `references/review-risk.md` — L1 Risk rules.
- `references/review-readability.md` — L2 Readability rules (absorbs coding standards).
- `references/review-reliability.md` — L3 Reliability rules.
- `references/review-resilience.md` — L4 Resilience rules.
- `references/review-architecture.md` — L5 Architecture rules (layering, coupling, repo-pattern conformance).
- `references/review-spec.md` — L6 Spec / intent-conformance rules.
