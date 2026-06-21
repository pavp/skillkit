---
name: skill-creator
description: "Trigger: new skills, agent instructions, documenting AI usage patterns. Create LLM-first skills with valid frontmatter."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Create a skill when:
- A pattern is used repeatedly and AI needs guidance
- Project-specific conventions differ from generic best practices
- Complex workflows need step-by-step instructions
- Decision trees help AI choose the right approach

Do not create a skill when the pattern is trivial, one-off, or better served by normal documentation.

## Hard Rules

- When working in this repo, first follow `docs/skill-style-guide.md` as the normative source before creating or updating skills.
- When the repo guide is unavailable (e.g. an installed global skill), use the compact inline rules below.
- A skill is a runtime instruction contract for an LLM, not human documentation.
- Do not add a `Keywords` section; preserve essential trigger words in `description`.
- References must point to local files.
- Keep the skill body concise: target 180–450 tokens, recommended max 700, hard max 1000.

## Decision Gates

| Need | Action |
|------|--------|
| Long explanation or background prose | Move to `references/`; keep only the rule in `SKILL.md` |
| Long code examples, schemas, templates | Put in `references/` or `assets/`; `SKILL.md` keeps rules + a one-line pointer (progressive disclosure) |
| Multiple meaningful paths | Add a compact decision table |

## Execution Steps

1. Check whether `docs/skill-style-guide.md` exists; if it does, apply it. Otherwise, apply the inline fallback rules below.
2. Confirm the skill does not already exist and the pattern is reusable.
3. Create or update the skill directory. `SKILL.md` holds the rules an agent always needs; long examples/schemas/templates go in `references/` or `assets/` and the installer (skills.sh) carries the whole directory:

```
skills/{skill-name}/
├── SKILL.md              # Required - rules + pointers
├── references/           # Optional - worked examples, docs (loaded on demand)
└── assets/               # Optional - templates, schemas, fixtures
```
4. Use this frontmatter shape:

```markdown
---
name: {skill-name}
description: "Trigger: {essential trigger words users or agents will say}. {What this skill does}."
license: Apache-2.0
metadata:
  author: "{your-github-username}"
  version: "1.0"
---
```
5. Write sections in this order: Activation Contract, Hard Rules, Decision Gates, Execution Steps, Output Contract, References.

## Inline Fallback Rules

- `description` MUST be one physical line, quoted, YAML-safe, and include essential trigger words first.
- `description` SHOULD be <=160 chars and MUST be <=250 chars.
- Frontmatter MUST include `name`, `description`, `license`, `metadata.author`, and `metadata.version`.
- Use imperative instructions, not tutorials or background prose.
- Keep `SKILL.md` to rules + pointers; move long examples/docs to `references/` or `assets/` (the installer carries the whole skill directory).

Good:

```yaml
description: "Trigger: Jira task, ticket, issue, task creation. Create Jira tasks in the team format."
```

Bad:

```yaml
description: >
  Create Jira tasks in the team format.
  Trigger: Jira task, ticket, issue, or task creation.
Keywords: jira, task
```

## Output Contract

Return:
- Files created or modified.
- Whether the repo style guide or inline fallback rules were used.

## References

- `docs/skill-style-guide.md` — normative LLM-first skill style guide for this repo (author-time only; not installed with the skill).