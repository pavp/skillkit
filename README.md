# skillkit

A collection of agent skills — reusable instruction sets for AI coding agents
(Claude Code, OpenCode, and any agent that reads the [Agent Skills](https://agentskills.io)
format).

Each skill is a directory under `skills/` containing a `SKILL.md` with YAML
frontmatter (`name`, `description`) and a markdown body of runtime instructions.

## Skills

Skills are grouped by domain under `skills/<category>/<name>/SKILL.md`.

### meta

| Skill | What it does |
|-------|--------------|
| [`skill-creator`](skills/meta/skill-creator/SKILL.md) | Create new LLM-first skills with valid frontmatter and the right structure. |
| [`skill-improver`](skills/meta/skill-improver/SKILL.md) | Audit and refactor existing skills against the style guide. |

### react

| Skill | What it does |
|-------|--------------|
| [`react-component`](skills/react/react-component/SKILL.md) | Structure React components — container/presentational split, hooks rules, naming, typed props. |
| [`react-component-patterns`](skills/react/react-component-patterns/SKILL.md) | Design reusable component APIs — compound components, slots, control props, state initializer, and extensible styles. |
| [`react-hooks`](skills/react/react-hooks/SKILL.md) | Reuse stateful logic — custom hooks and (rarely) render props. |

### typescript

| Skill | What it does |
|-------|--------------|
| [`ts-types`](skills/typescript/ts-types/SKILL.md) | Model types — union vs const-object, `satisfies`, flat interfaces, `unknown` + guards/assertions, utility types. |
| [`ts-function-signatures`](skills/typescript/ts-function-signatures/SKILL.md) | Design function/hook/component signatures — positional vs options object, defaults, overloads vs unions. |
| [`ts-module-organization`](skills/typescript/ts-module-organization/SKILL.md) | Organize modules — `import type` / `verbatimModuleSyntax`, barrel files, path aliases, circular deps. |

### workflow

| Skill | What it does |
|-------|--------------|
| [`review-6-lens`](skills/workflow/review-6-lens/SKILL.md) | Review a diff across 6 isolated lenses — Risk, Readability, Reliability, Resilience, Architecture and Spec — and report each separately. |
| [`review-comments`](skills/workflow/review-comments/SKILL.md) | Draft and consolidate review comments — concept-first, with a closing question — and gate on confirmation. Delivers drafts ready to post; never posts. |
| [`leave-it-cleaner`](skills/workflow/leave-it-cleaner/SKILL.md) | Boy Scout Rule, any language — after the asked task, make a cohesive, proportional, behavior-preserving cleanup of the zone you touched, and say what you did. |
| [`clean-comments`](skills/workflow/clean-comments/SKILL.md) | Judgment authority on comments, any language — classifies each as noise / load-bearing / commented-out / trailing / out-of-domain via the surprise test and reason-token gate. Judges; never deletes. |

## Install

Skills install via [`skills.sh`](https://skills.sh) (`npx skills`), the open
agent-skills installer. No build step — the `SKILL.md` files are consumed as-is.

```bash
# Install all skills to the agents you choose (interactive)
npx skills add pavp/skillkit

# Pick specific skills and agents
npx skills add pavp/skillkit -s react-component -a claude-code -a opencode

# Install everything to every detected agent
npx skills add pavp/skillkit --all
```

Use `npx skills list` to see what's installed and `npx skills update` to refresh.

## Authoring

`docs/skill-style-guide.md` is the normative style guide for skills in this repo.
Use the `skill-creator` skill to scaffold a new one and `skill-improver` to audit
it against the guide. Keep each skill's body within the guide's token budget and
put trigger words first in the `description`.

## License

Apache-2.0
