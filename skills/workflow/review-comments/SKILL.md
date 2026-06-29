---
name: review-comments
description: "Trigger: turn review findings into comments for a PR/issue, copy-pasted code, or terminal review. Drafts human, concept-first comments that close with a question, consolidates them, gates on confirmation, and delivers drafts without posting."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: 1.0.0
---

Turn supplied review findings into human comments, consolidate, gate on confirmation, and deliver drafts. This skill never posts; it hands off.

## Activation Contract

Load when the user wants comments written from review findings, in any modality. **Locus** — where a finding targets: a `file:line` anchor when one exists, else a text reference (note id, section, symbol).

- A GitHub PR or issue under review.
- Copy-pasted code or a diff with observations.
- A terminal review with no PR — comments read back to the user, never posted.
- Loose notes, or the structured output of another review skill.

## Hard Rules

- **Consume only.** Do NOT review or generate findings; act only on findings already supplied. Already-written comments are re-drafted to the three-beat shape, not passed through verbatim; if one lacks the mechanism, ask rather than invent it.
- **Comment shape.** Every comment MUST follow the three-beat shape in `comment-shape.md`: observation with the mechanism (what breaks and why) first, then proposal, then a closing question.
- **No severity tags.** Never label a comment with a severity; the content carries the weight.
- **Consolidate.** One comment per locus, highest-value point only. No pile-ons.
- **No AI tells.** No hedging, no em-dashes inside comments, no robotic checklists, no praise warm-up. See `comment-shape.md` anti-patterns.
- **Language.** Draft in the thread's language (translate findings from another); ambiguous or mixed → default English, note it in the gate.
- **Gate, then hand off.** Share drafts and get unambiguous confirmation before treating them as final. A vague reply ("ok", "sure") is not confirmation; ask once to confirm.
- **Never post.** The runtime, user, or another tool posts. Do NOT hardcode `gh`/any vendor API or invoke a posting tool yourself.

## Decision Gates

| Situation | Action |
|-----------|--------|
| PR/issue, or structured output of another review skill | Draft with each `file:line` anchor for inline placement; drop any severity. No anchor → next row. |
| Copy-paste / notes / terminal, no anchor | Consolidated review, each point referencing its locus in text. |
| No findings, or all verified-clean | Do not invent issues. Say so and ask whether to proceed. |
| All pure nits | Fold into a single optional note; ask whether to include it. |

## Execution Steps

1. Collect findings and loci. If none or all empty, ask (see gate).
2. Consolidate to the highest-value point per locus; if zero remain, surface that and ask.
3. Draft each comment in the required shape and language.
4. Present drafts (Output Contract); ask to adjust, hand off, or skip.
5. On unambiguous confirmation, hand off the final drafts.

## Output Contract

Each locus is a `###` heading (a `file:line` only for a real navigable anchor, else a plain text reference) with the draft comment beneath. Two phases, detailed in `comment-shape.md`: **Presentation** (step 4) ends with a `---` then a one-line gate prompt (confirm, adjust, skip); **Hand-off** (step 5, post-confirmation) returns the comment sections only — no gate, no `---`, no meta-commentary — ready to copy verbatim. Never severity tags.

## References

- `comment-shape.md` — the three-beat comment shape with worked examples and anti-patterns.
