# AGENTS.md

Guidance for AI agents working in **skillkit** — a collection of agent skills (reusable instruction sets for AI coding agents that read the [Agent Skills](https://agentskills.io) format).

## What this repo is

Each skill is a directory containing a `SKILL.md` (YAML frontmatter + markdown body of runtime instructions). Skills are grouped by domain/process under `skills/<category>/<name>/SKILL.md`. There is **no build step** — `SKILL.md` files are consumed as-is and installed via `npx skills` (skills.sh).

## Layout

```
skills/
  meta/        skill-creator, skill-improver
  react/       react-component, react-hooks, react-component-patterns
  typescript/  ts-types, ts-function-signatures, ts-module-organization
  workflow/    review-6-lens, review-comments, leave-it-cleaner, clean-comments, clean-names, clean-functions, clean-structure, slice-diff, browser-automation-safety
docs/
  skill-style-guide.md   normative style guide (author-time only; not installed)
README.md
```

A skill may ship supporting files alongside `SKILL.md`:
- `references/` — local docs the skill loads on demand (rules, dispatch contracts, edge cases).
- `assets/` — templates, schemas, fixtures.

## Authoring a skill

`docs/skill-style-guide.md` is the normative contract. The essentials:

- **Frontmatter** (required): `name`, one-line quoted `description` (≤250 chars, trigger words first: `"Trigger: … . {what it does}."`), `license`, `metadata.author`, `metadata.version`.
- **Body budget**: target 180–450 tokens, recommended max 700, hard max 1000. Move detail (examples, schemas, long rules) into `references/`.
- **Section order**: Frontmatter → Activation Contract → Hard Rules → Decision Gates → Execution Steps → Output Contract → References.
- Write imperative runtime instructions, not tutorial prose. Decision forks go in compact tables. References point to local files only — never external URLs as the primary source.

Use the `skill-creator` skill to scaffold a new one and `skill-improver` to audit an existing one against the guide.

## Conventions

- **Author**: `metadata.author: pedro-villarreal(pavp)` across skills.
- **Categories** group by domain (`react`, `typescript`) or process (`workflow`). Add a new category folder when a skill fits neither.
- Skills are **runtime-agnostic**: do not hardcode a specific agent type (e.g. `general-purpose`) or a vendor's nomenclature. Describe the capability a skill needs, not the API that provides it.
- Keep the lens/finding naming internal to a skill consistent (see `workflow/review-6-lens` for the L1–L6 lens pattern).
- **Comments in authored code**: default is NONE. Write a comment ONLY for a WHY the code cannot show; never restate WHAT the code does. When unsure, apply the `workflow/clean-comments` surprise test — if deleting it loses nothing, don't write it. This governs code you author here (skill examples, references); `clean-comments` remains the authority for judging existing comments.

## Non-negotiables

- `SKILL.md` is the source of truth for a skill; nothing generated replaces its content.
- After adding, moving, or renaming a skill, update `README.md`'s skill table.
- Commits use Conventional Commits. No AI attribution / `Co-Authored-By` lines.
- Branch off `main`; never commit directly to `main`. Open a PR.

## Distribution

```bash
npx skills add pavp/skillkit                          # all skills, interactive
npx skills add pavp/skillkit -s <skill> -a claude-code # specific skill + agent
npx skills add pavp/skillkit --all                     # everything, everywhere
```
