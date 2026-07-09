# Dispatch Contract

How to build each lens's prompt. All 6 lenses share one skeleton; only the rules file, label, and (for Spec) the intent differ.

| Lens | Label | Rules file |
|------|-------|-----------|
| Risk | `Risk lens` | `references/review-risk.md` |
| Readability | `Readability lens` | `references/review-readability.md` |
| Reliability | `Reliability lens` | `references/review-reliability.md` |
| Resilience | `Resilience lens` | `references/review-resilience.md` |
| Architecture | `Architecture lens` | `references/review-architecture.md` |
| Spec | `Spec lens` | `references/review-spec.md` |

Prompt each lens with exactly these steps:

1. Read your rules and output contract: `<rules file>`.
2. The diff under review is `git diff <point>...HEAD` (`<N>` changed lines); commits: `git log <point>..HEAD --oneline`. (Spec only: the requested intent is this text: `<normalized intent>`.)
3. Apply ONLY your lens rules. Emit findings in the EXACT shape defined in `references/finding-shape.md` (your rules file points to it) — bold title, `(Lens — file:line)`, blockquoted `Why it matters` + evidence, `→ Fix`; compact one-line for 🔵. Stay in your lane; defects another lens owns are not yours. Your returned text IS the report — no preamble, no closing summary.

## Sweep depth (per lens, proportional)

Each lens sweeps its OWN review material with its OWN rules — never another lens's context — at a depth proportional to the diff:

- **Always** do pass 1 over your full review material (the diff, or for Spec the intent-vs-diff comparison).
- **Re-sweep** (do another pass) ONLY when the diff is large — the `<N>` changed-line count you were given is **>200** — OR pass 1 surfaced **≥3 findings** in your lens. A small, clean diff stops at one pass.
- Once re-sweeping, **stop as soon as a pass surfaces zero NEW findings** (a single dry pass is enough — pass 1 is not counted as the dry pass); hard ceiling **4 passes** regardless. A finding is NEW only if it is a distinct defect — a different `file:line`, or the same line but a materially different problem — not a re-wording of one you already have; and never drop a genuinely distinct finding because it resembles one you have.
- The sweep is your own exhaustiveness loop; it never widens your scope. You still emit only your lens's findings, once, as the final consolidated set.

Run lenses in isolation (parallel sub-agents if the runtime supports them; otherwise sequential with reset context). Use the Label as the sub-agent's short `description` for traceability when lenses run concurrently.
