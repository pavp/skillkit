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
2. The diff under review is `<diff-cmd>` (`<N>` changed lines; changed regions: `<changed-hunks>`); commits: `git log <point>..HEAD --oneline`. (Spec only: the requested intent is this text: `<normalized intent>`.) `<changed-hunks>` is capped: a file with more than ~20 distinct ranges is collapsed to a whole-file `path: ALL` marker — treat any line in that file as inside a changed region (fail toward `introduced`), never expand the list per prompt.
3. Apply ONLY your lens rules. Emit findings in the EXACT shape defined in `references/finding-shape.md` (your rules file points to it) — bold title, `(Lens — file:line · introduced|pre-existing)`, blockquoted `Why it matters` + evidence, `→ Fix`; compact one-line for 🔵. Stay in your lane; defects another lens owns are not yours. Your returned text IS the report — no preamble, no closing summary.
4. **Classify causality** (all lenses except Spec, which is exempt). `introduced` is the **safe default**: a finding is `pre-existing` ONLY on positive evidence it sits outside every changed region. Tag each finding:
   - `introduced` — the `file:line` it cites is inside a **changed region** (`<changed-hunks>`: a HEAD line the diff added, or the HEAD line immediately adjacent to a pure deletion). Deletions have no HEAD line of their own — anchor them to that adjacent line, given in the region set.
   - `behavior-activated` — the defect's **trigger** is inside a changed region (a caller you added, a guard you removed) but the **victim** line it cites is outside. Counts as blocking, same as `introduced` (the diff made the defect reachable). Tag it as such so the aggregator keeps it in the severity sections.
   - `pre-existing` — the cited line, and any trigger for it, are outside every changed region. Only this tag is non-blocking.
   - **No citable line** (whole-file / absence defect, e.g. "no test covers the added branch"): tag `introduced`, anchored to the added region it concerns. Never default a line-less finding to `pre-existing`.
   - **Degraded input**: if `<changed-hunks>` is empty or malformed while the diff is non-empty (`<N>` > 0), tag every finding `introduced` (fail toward blocking) — never `pre-existing`. (A `path: ALL` marker is not degraded — it is the intended whole-file signal; treat every line in that file as changed.)
   This is a membership check against the regions given, not a judgment call; do not re-decide it per pass.

## Sweep depth (per lens, proportional)

Each lens sweeps its OWN review material with its OWN rules — never another lens's context — at a depth proportional to the diff:

- **Always** do pass 1 over your full review material (the diff, or for Spec the intent-vs-diff comparison).
- **Re-sweep** (do another pass) ONLY when the diff is large — the `<N>` changed-line count you were given is **>200** — OR pass 1 surfaced **≥3 findings** in your lens. A small, clean diff stops at one pass.
- Once re-sweeping, **stop as soon as a pass surfaces zero NEW findings** (a single dry pass is enough — pass 1 is not counted as the dry pass); hard ceiling **4 passes** regardless. A finding is NEW only if it is a distinct defect — a different `file:line`, or the same line but a materially different problem — not a re-wording of one you already have; and never drop a genuinely distinct finding because it resembles one you have.
- The sweep is your own exhaustiveness loop; it never widens your scope. You still emit only your lens's findings, once, as the final consolidated set.

Run lenses in isolation (parallel sub-agents if the runtime supports them; otherwise sequential with reset context). Use the Label as the sub-agent's short `description` for traceability when lenses run concurrently.
