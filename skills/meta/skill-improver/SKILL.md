---
name: skill-improver
description: "Trigger: improve skills, audit skills, refactor skills, skill quality. Audit and upgrade existing LLM-first skills."
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

## Decision Gates

| Situation | Action |
| --- | --- |
| Missing or invalid frontmatter | Fix `name`, quoted one-line `description`, `license`, and `metadata` |
| Skill reads like tutorial docs | Convert to runtime instructions; compress background inline |
| Body exceeds budget | Preserve rules; move examples/background to `references/` (progressive disclosure) |
| Branching logic hidden in prose | Convert to a compact decision table |
| Rules conflict or intent is unclear | Report the issue; do not rewrite that rule automatically |

## Execution Steps

1. Read `docs/skill-style-guide.md` if it exists; otherwise enforce the core LLM-first structure: frontmatter, Activation Contract, Hard Rules, Decision Gates, Execution Steps, Output Contract, References.
2. For each selected skill, audit metadata, trigger clarity, section order, body budget, actionability, decision gates, output contract, and local references.
3. Return an audit report grouped by skill with severity and exact proposed changes.
4. In apply mode, edit only safe issues, preserve content, create supporting files when needed.

## Output Contract

Return:
- Skills audited and paths used.
- Issues found, grouped by severity.
- Files changed, if apply mode was requested.
- Registry refresh recommendation when skill metadata or paths changed.
- Ambiguities that need human review.

## References

- `docs/skill-style-guide.md` — normative LLM-first skill style guide for this repo (author-time only; not installed with the skill).