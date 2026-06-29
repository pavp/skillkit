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
2. The diff under review is `git diff <point>...HEAD`; commits: `git log <point>..HEAD --oneline`. (Spec only: the requested intent is this text: `<normalized intent>`.)
3. Apply ONLY your lens rules. Emit findings in the EXACT shape defined in `references/finding-shape.md` (your rules file points to it) — bold title, `(Lens — file:line)`, blockquoted `Why it matters` + evidence, `→ Fix`; compact one-line for 🔵. Stay in your lane; defects another lens owns are not yours. Your returned text IS the report — no preamble, no closing summary.

Run lenses in isolation (parallel sub-agents if the runtime supports them; otherwise sequential with reset context). Use the Label as the sub-agent's short `description` for traceability when lenses run concurrently.
