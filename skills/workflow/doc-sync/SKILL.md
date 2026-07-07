---
name: doc-sync
description: "Trigger: sync docs after a code change, 'update the README/docs for this PR', docs that lie, stale AGENTS.md/CLAUDE.md, a doc claim the code contradicts after a refactor. Patches existing docs against the code — agent-facing aggressively, human-facing conservatively, never rewriting a narrated WHY. Authoring docs from scratch is out of scope; in-code comments → clean-comments."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.1"
---

## Activation Contract

Load when EXISTING docs must be reconciled with code that changed under them: after a diff/PR, a doc claim the code contradicts, stale `AGENTS.md`/`CLAUDE.md`, "is this doc still right after my refactor?". Do NOT load to author docs where none exist, or to judge in-code comments (`clean-comments`).

Terms: a **claim** = a verifiable assertion the code confirms or falsifies (command, signature, path, flag, count, name). A **hard contradiction** = current code is PROOF a claim is false; "feels dated" or needs-inference is NOT hard. A **narrated WHY** = intention the code cannot show (decision, rationale, tradeoff, history) — not a claim.

## Hard Rules

- **Iron Law: NO DOC EDIT WITHOUT A HARD CONTRADICTION.** Verify or leave it.
- **WHY is sacred, judged per PASSAGE.** A passage carrying a narrated WHY → `Needs-decision`, never an edit — even in an agent-facing doc, even if a falsifiable token sits inside it. The code may be what drifted. Never rewrite a fact living inside a WHY sentence.
- **Anti-filler (surprise test).** Never add a sentence a reader would not be SURPRISED to lose — the `clean-comments` bar.
- **The enumerated doc set IS the boundary.** Fix it BEFORE verifying; report it. A doc cross-referencing another does NOT expand it. Never "find more docs" or "review the code".
- **Bounded, or STOP.** Cap 3 lookups per claim. Code unreadable/ambiguous/gone, or cap spent → `Unverifiable`, never a guessed Verified-OK. Diff empty/malformed → fall back to Audit or report; never invent the change set.
- **Local text only.** No push, PR, or write-back. Commit only on an affirmative SEPARATE from the sync trigger, never onto `main`.

## Decision Gates

**Scope gate (applied first, step 1):**

| Signal | Mode |
|--------|------|
| Diff / commit range / PR given | Compare only what changed against the doc set. |
| No diff | Audit: default set = `README`, agent-instruction files, `docs/**` (or a narrower set the user names). Verify each claim; STOP when exhausted. |

**Audience gate (per doc, step 2) — sets the dial for claim-only prose. The per-passage WHY rule overrides it either way:**

| Reader | What it is (e.g.) | Dial |
|--------|-------------------|------|
| Agent | doc a tool reads at runtime to act (`AGENTS.md`, `CLAUDE.md`, editor-rule/skill files) | Drift = operational lie. Patch directly. |
| Human | doc for a person to understand (`README`, `docs/**`, ADRs, guides, tutorials) | Conservative; anti-filler ON. |
| Unclear | reader unknown | Treat as human. |

## Execution Steps

1. **Enumerate & fix the boundary.** List docs in scope (Scope gate); report the set before verifying.
2. **Classify.** Audience gate per doc → dial (record the row).
3. **Extract claims.** Pull verifiable claims; skip WHY passages.
4. **Verify & route** each claim per the Act table.
5. **Act:**

| Case | Route |
|------|-------|
| No contradiction | Verified-OK |
| Can't read/find code, or 3-lookup cap spent | `Unverifiable` |
| Touches a WHY, or doc-vs-code unclear | `Needs-decision` |
| Hard contradiction, claim-only, agent doc | patch |
| Hard contradiction, claim-only, human doc | patch the pure fact |
| Code removed (not renamed) | agent → patch/remove; human → `Needs-decision` |

A recurring claim resolves identically across docs unless the dial differs.
6. **Handoff.** Report per contract. Suggest a commit if one fits; never push or open a PR.

## Output Contract

Grouped; each doc entry states its dial `[Agent|Human]`:
- **Synced:** `file:line [dial]` old → new + the code that proves it.
- **Verified-OK:** claims checked, still accurate (count or list).
- **Needs-decision:** contradiction touching a WHY or ambiguous — state both sides (doc says / code does), recommend a move, edit NOTHING.
- **Unverifiable:** claim whose code could not be read/found — say why.
- **Out of scope:** docs the boundary excluded.

Never present an unverified change — or an unverifiable claim — as a fact fix. Leave no speculative edits in the tree.

## References

- `references/methodology.md` — the audience dial worked examples, claim-extraction per doc type, the surprise test on prose, and the `Needs-decision` rationalizations that signal a skipped WHY.
