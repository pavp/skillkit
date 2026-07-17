# LLM-first Skill Style Guide

Use this guide when creating or refactoring skills in this repo. A skill is a **runtime instruction contract for an LLM**, not human-facing documentation: it tells the model when to activate, what rules are non-negotiable, how to decide, what to do, and what to return.

## Required Structure

Every `SKILL.md` MUST use this order unless a section is truly irrelevant:

1. **Frontmatter** — complete metadata for skill discovery.
2. **Activation Contract** — exact situations that load the skill.
3. **Hard Rules** — constraints the LLM MUST NOT violate.
4. **Decision Gates** — short tables or bullets for branching choices.
5. **Execution Steps** — ordered operational workflow.
6. **Output Contract** — required final format or artifacts.
7. **References** — local files only; supporting detail lives outside the skill.

`## Compact Rules` is not required. The skill registry indexes skill names, triggers, scopes, and paths; agents load the full `SKILL.md` as the source of truth.

## Frontmatter Rules

- `description` MUST be one physical line, YAML-safe, and quoted.
- Keep the `Trigger:` prefix as a convention label, then shape the description in this order: **what it does** → a **pushy "use this when …" clause** that fires even when the user does not name the skill → **concrete trigger anchors** (example phrases the user would type + code signals they'd have on screen) → a **disambiguation arrow** to sibling skills (`→ other-skill`) whenever a confusable sibling exists in the catalog (omit only when none does). Under-triggering is the common failure; a description that only *describes* will not fire. (This supersedes the older `"Trigger: … . {what}"` template.)
- Include at least one *non-obvious* anchor: the test is that it fires on the skill's intent even when the user's words never name the concept — not just the textbook keyword. E.g. a "component" skill must anchor on a `provider`/`boundary` (not only visual widgets); a "hooks" skill on "the same logic in more than one place" (not only the word "hook").
- `description` SHOULD be <=380 chars and MUST be <=400 chars. A full pushy description (what + use-when + anchors + arrow) realistically costs ~370; the platform hard cap is 1024, but the description is always in context for every installed skill — keep it lean, not maximal.
- Include complete `name`, `description`, `license`, `metadata.author`, and `metadata.version`.
- Do NOT add a `Keywords` section; discovery uses frontmatter.

## Body Budget

- Target **180–450 tokens** for the skill body.
- Recommended maximum: **700 tokens**.
- Hard maximum: **1000 tokens**. Move examples, schemas, and background into `assets/` or `references/`.

## Writing Rules

### DO

- Write imperative runtime instructions: “Load X”, “Check Y”, “Return Z”.
- Lead with the activation trigger and hard constraints.
- Use compact tables for decision gates.
- Keep examples minimal and executable.
- Link to local supporting files for details.

### DON'T

- Explain history, motivation, or tutorial background.
- Duplicate long docs inside the skill.
- Add generic advice the LLM cannot execute.
- Use external URLs as primary references.
- Hide critical rules below examples.

## Supporting Files

- Use `assets/` for templates, schemas, fixtures, or generated examples.
- Use `references/` for local docs that explain concepts or edge cases.
- Keep references stable and relative to the skill directory when possible.

## Registry Behavior

- `gentle-ai skill-registry refresh` indexes skills; it does not summarize or rewrite them.
- The registry records `name`, `description` trigger text, scope, and exact `SKILL.md` path.
- Delegators pass matching paths to subagents, and subagents read the full skill before work.
- Use `skill-improver` to audit and refactor existing skills against this guide.

## Quality Gates

- Frontmatter is complete, quoted, single-line, and trigger-preserving.
- Required sections exist in the expected order.
- Hard rules are testable or observable.
- Decision gates cover meaningful forks only.
- Output contract tells the LLM exactly what to return.
- References point to local files.

## Refactor Checklist

- [ ] Move explanatory prose to local references.
- [ ] Collapse repeated rules into one hard rule.
- [ ] Replace prose branches with a decision table.
- [ ] Trim examples to the smallest useful case.
- [ ] Recheck description: within 400 chars, pushy "use this when …" clause, concrete anchors incl. one non-obvious case.