---
name: skill-improver
description: "Trigger: improve, audit, refactor, or normalize existing skills; skill quality; a trigger that under-fires or two skills that compete. Use this whenever an existing SKILL.md needs review — even phrased as 'why doesn't this skill fire' or 'is this description good'. Audits existing LLM-first skills and can measure trigger accuracy. New skill from scratch → skill-creator."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Use this skill when asked to audit, refactor, normalize, or improve existing `SKILL.md` files. Use `skill-creator` instead when creating a brand-new skill from a reusable pattern.

## Hard Rules

- Treat `docs/skill-style-guide.md` as the normative style contract when it exists; otherwise enforce the inline core structure (see Execution Steps).
- Treat `SKILL.md` as the source of truth; preserve author intent, critical rules, activation semantics, and output requirements.
- Default to audit-only. Modify files only when the user explicitly asks to apply improvements.
- Never delete meaningful content silently; move long explanation, examples, or schemas to `references/` rather than dropping them (the installer carries the whole skill directory).
- Do not invent triggers, policies, or domain rules. Mark ambiguous cases for human review.
- Judge trigger quality by MEASUREMENT, not inspection: a description that reads well can still under-trigger. Run the trigger-eval (see Execution Steps for its run condition) before declaring a description sound.

## Decision Gates

| Situation | Action |
| --- | --- |
| Missing or invalid frontmatter | Fix `name`, quoted one-line `description`, `license`, and `metadata` |
| Skill reads like tutorial docs | Convert to runtime instructions; compress background inline |
| Body exceeds budget | Preserve rules; move examples/background to `references/` (progressive disclosure) |
| Branching logic hidden in prose | Convert to a compact decision table |
| Rules conflict or intent is unclear | Report the issue; do not rewrite that rule automatically |
| Description under-triggers or competes with a sibling skill | Run the trigger-eval (Execution Steps); rewrite the description from the misses, not from taste |

## Execution Steps

1. Read `docs/skill-style-guide.md` if it exists; otherwise enforce the core LLM-first structure: frontmatter, Activation Contract, Hard Rules, Decision Gates, Execution Steps, Output Contract, References.
2. For each selected skill, audit metadata, trigger clarity, section order, body budget, actionability, decision gates, output contract, and local references.
3. Return an audit report grouped by skill with severity and exact proposed changes.
4. In apply mode, edit only safe issues, preserve content, create supporting files when needed.

### Trigger-eval

**Run condition (canonical):** run this whenever a description was changed, or a skill's firing is otherwise in doubt (suspected under-trigger or competition with a sibling). Hard Rules and Decision Gates point here rather than restating the condition.

Measures whether the description actually fires — descriptions under-trigger even when they read well. Do NOT judge by inspection alone.

1. Write ~20 realistic queries a user would actually type — casual, specific, concrete (file paths, framework names, snippets), some without naming the skill. Split: 8–10 that SHOULD fire this skill, 8–10 that should NOT. The valuable should-not cases are near-misses that share vocabulary with a sibling skill but need a different one.
2. Assemble the candidate set: the skill under test, every sibling whose vocabulary overlaps it, and one unrelated distractor (so "none" is a real option). For each query, spawn a fresh, context-free reviewer that sees ONLY those descriptions — no conversation, no SKILL.md body — and returns one verdict: which skill fires, or "none". Run the queries in parallel.
3. Score: a hit is the expected skill firing (or correctly firing none). Report accuracy and every miss verbatim.
4. Rewrite the description FROM THE MISSES — add the missed phrasing or a disambiguating clause; never from taste. Re-run until misses are gone or justified.

## Output Contract

Return:
- Skills audited and paths used.
- Issues found, grouped by severity.
- Files changed, if apply mode was requested.
- Trigger-eval accuracy and remaining misses, when the eval was run.
- Registry refresh recommendation when skill metadata or paths changed.
- Ambiguities that need human review.

## References

- `docs/skill-style-guide.md` — normative LLM-first skill style guide for this repo (author-time only; not installed with the skill).