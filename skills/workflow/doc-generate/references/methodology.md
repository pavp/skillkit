# doc-generate methodology

Detail the SKILL.md defers. Load when a call needs the WHAT-vs-WHY line, per-artifact writing patterns, or the hallucinated-rationale tells.

## The WHAT-vs-WHY line — the skill's core discipline

Code proves WHAT it does. It never proves WHY a human chose it. doc-generate documents the first and refuses to fabricate the second.

Worked example — a module uses Redis:

- **Provable (write it):** "`session.ts` stores sessions in Redis via `ioredis`, keyed by `sess:<uid>`, TTL 3600s." Every token is anchored to code.
- **NOT provable (do NOT write):** "The team chose Redis over Postgres for lower session-read latency." Nothing in the code proves the *reason*. It is plausible and may be false. Omit, or `inferred — verify`.

This is the exact mirror of `doc-sync`: doc-sync protects a human's narrated WHY from being overwritten; doc-generate resists inventing one that was never written. Same doctrine — the WHY does not come from code — applied to authoring.

**The test is structural, not a word blocklist.** Ask of every claim: does it answer *"what does this code do, mechanically"* (→ WHAT) or *"why would someone do this"* (→ WHY)? A claim naming a motive/goal/reason is WHY even without trigger words. A borderline claim (observable AND implies intent) has three moves, in this order: (1) rephrase as pure behavior and keep as WHAT — "requests pass a rate limiter before the DB" not "to protect the DB from overload"; (2) if it can't be stated without the motive, omit it; (3) or mark `inferred — verify`. Two leaks to catch: naming the reason in the text, AND selecting *this* fact over others because of a motive you inferred — curation smuggles WHY as surely as diction.

## LLM-first writing patterns per artifact

| Artifact | Lead with | Cut |
|----------|-----------|-----|
| agent instructions (e.g. `AGENTS.md`, `CLAUDE.md`, editor-rule/skill files) | exact commands (`pnpm test`), conventions, non-negotiables, paths | project history, marketing, "why this matters" prose |
| Context wiki | module → responsibility → entrypoint → key flows, each anchored | narrative arc, onboarding tone, restated file tree |

Both: imperative voice, tables over paragraphs, no sentence a grep couldn't justify. The reader is a token-bounded agent, not a new hire.

## Deterministic boundaries — so two runs match

- **Module enumeration (context wiki):** one doc per top-level directory under the resolved scope that contains its own entrypoint (a main/index/exported public surface). Not per file, not per arbitrary grouping. Same tree → same module list → same existing/missing split.
- **"Public API surface" (depth bound):** where exports are explicit (barrel file, `__all__`, access modifiers), use them. Where they aren't, public = any symbol imported or called from outside its own file/directory. Draw the direct-dependency line at that set; do not recurse past it.

## The surprise test applied to generated docs

Same bar as `clean-comments`: a line earns its place only if a reader would be SURPRISED to lose it.

- Restating the directory tree the agent can already `ls` → noise.
- "This project uses TypeScript" when `tsconfig.json` is right there → noise.
- "`auth/` calls `billing/` synchronously on signup, which blocks the request" → keep; a reader would NOT guess the coupling.

## Hallucinated-rationale tells — signals you are inventing a WHY

Stop and either omit or mark `inferred — verify` when you catch yourself writing:

- "…for performance / scalability / flexibility." (Did the code prove the motive, or did you assume it?)
- "The team decided…" / "This was chosen because…" (Where is that written? If nowhere → do not assert it.)
- "This is designed to…" (Design intent is a WHY. Unless a comment/ADR says so, you are guessing.)
- Any causal claim about a human's reasoning that no comment, ADR, or commit message states.

Anchored WHAT is the product. Unanchored WHY is the failure mode.
