# skillkit

A collection of agent skills — reusable instruction sets for AI coding agents
(Claude Code, OpenCode, and any agent that reads the [Agent Skills](https://agentskills.io)
format).

Each skill is a directory under `skills/` containing a `SKILL.md` with YAML
frontmatter (`name`, `description`) and a markdown body of runtime instructions.

## Skills

| Skill | What it does |
|-------|--------------|
| [`skill-creator`](skills/skill-creator/SKILL.md) | Create new LLM-first skills with valid frontmatter and the right structure. |
| [`skill-improver`](skills/skill-improver/SKILL.md) | Audit and refactor existing skills against the style guide. |
| [`react-component`](skills/react-component/SKILL.md) | Structure React components — container/presentational split, hooks rules, naming, typed props. |

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
