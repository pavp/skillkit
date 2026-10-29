# skillkit

A collection of agent skills — reusable instruction sets for AI coding agents
(Claude Code, OpenCode, and any agent that reads the [Agent Skills](https://agentskills.io)
format).

Each skill is a directory under `skills/` containing a `SKILL.md` with YAML
frontmatter (`name`, `description`) and a markdown body of runtime instructions.

## Install

Skills install via [`skills.sh`](https://skills.sh) (`npx skills`), the open
agent-skills installer. No build step — the `SKILL.md` files are consumed as-is.

```bash
# Install all skills to the agents you choose (interactive)
npx skills add pavp/skillkit
```

Use `npx skills list` to see what's installed and `npx skills update` to refresh.

### Recommended bundle: cleanup

`leave-it-cleaner` works standalone, but it consults the `clean-*` judgment
skills when they are installed — each judge is also independently useful on its
own. To install the full cleanup family:

```bash
npx skills add pavp/skillkit -s leave-it-cleaner -s clean-comments -s clean-names -s clean-functions -s clean-structure -a claude-code
```

### Recommended setup: React and TypeScript projects

Agents skip skills that overlap what they already know, and React and
TypeScript are exactly that: in practice the agent edits `.ts`/`.tsx` files
without loading `react-*` or `ts-*`, and spawned subagents almost never do. A
skill's description is an offer the agent may decline; project instructions are
always in context.

Install the skills, then copy the block from each snippet into the project's
`AGENTS.md`. It tells the agent which skill to load before each kind of edit and
keeps the critical rules in context even when none loads.

| Snippet | Install |
|---|---|
| [`snippets/react.md`](snippets/react.md) | `npx skills add pavp/skillkit -s react-component -s react-hooks -s react-component-patterns -s react-memoization -s style-in-regime` |
| [`snippets/typescript.md`](snippets/typescript.md) | `npx skills add pavp/skillkit -s ts-types -s ts-function-signatures -s ts-module-organization` |

Claude Code ignores `AGENTS.md` when the project also has a `CLAUDE.md`; add
`@AGENTS.md` to that `CLAUDE.md` (or paste the snippets there instead). After
`npx skills update`, replace each block between its start and end markers.

### Recommended setup: verify before every PR

Agents call work done on green tests. `verify-before-pr` makes them prove it
first, against the running app, and package the evidence for the PR. Like the
React and TypeScript skills, it fires reliably only when project instructions
ask for it, so pair it with its snippet in any stack.

| Snippet | Install |
|---|---|
| [`snippets/workflow.md`](snippets/workflow.md) | `npx skills add pavp/skillkit -s verify-before-pr -s browser-automation-safety` |

## Skills

Skills are grouped by domain under `skills/<category>/<name>/SKILL.md`.

### meta

| Skill | What it does |
|-------|--------------|
| [`skill-creator`](skills/meta/skill-creator/SKILL.md) | Create new LLM-first skills with valid frontmatter and the right structure. |
| [`skill-improver`](skills/meta/skill-improver/SKILL.md) | Audit and refactor existing skills against the style guide; measure trigger accuracy with a virgin-subagent eval. |

### react

| Skill | What it does |
|-------|--------------|
| [`react-component`](skills/react/react-component/SKILL.md) | Structure React components — container/presentational split, hooks rules, naming, typed props. |
| [`react-component-patterns`](skills/react/react-component-patterns/SKILL.md) | Design reusable component APIs — compound components, slots, control props, state initializer, and extensible styles. |
| [`react-hooks`](skills/react/react-hooks/SKILL.md) | Reuse stateful logic — custom hooks and (rarely) render props. |
| [`react-memoization`](skills/react/react-memoization/SKILL.md) | Decide whether useMemo/useCallback/memo belongs — regime-aware (React Compiler on/off), pure-perf vs semantic identity. |
| [`style-in-regime`](skills/react/style-in-regime/SKILL.md) | Detect the project's styling regime and judge whether each inline style (MUI `sx`, `style`, CSS-in-JS, Tailwind arbitrary values) belongs there or in the regime's canonical style unit. |

### typescript

| Skill | What it does |
|-------|--------------|
| [`ts-types`](skills/typescript/ts-types/SKILL.md) | Model types — union vs const-object, `satisfies`, flat interfaces, `unknown` + guards/assertions, utility types. |
| [`ts-function-signatures`](skills/typescript/ts-function-signatures/SKILL.md) | Design function/hook/component signatures — positional vs options object, defaults, overloads vs unions. |
| [`ts-module-organization`](skills/typescript/ts-module-organization/SKILL.md) | Organize modules — `import type` / `verbatimModuleSyntax`, barrel files, path aliases, circular deps. |

### review

| Skill | What it does |
|-------|--------------|
| [`review-6-lens`](skills/review/review-6-lens/SKILL.md) | Review a diff across 6 isolated lenses — Risk, Readability, Reliability, Resilience, Architecture and Spec — and report each separately. Every blocking finding is then challenged — by an independent refuter, or inline when reading the cited lines settles it; a finding only stops blocking on a cited counter-example, and nothing is ever dropped. |
| [`pr-review`](skills/review/pr-review/SKILL.md) | Review someone else's PR end-to-end and leave one consolidated comment on it. Orchestrates only: `review-6-lens` judges, you pick which findings become comments, `pr-comments` writes them. Nothing posts unconfirmed. |
| [`pr-comments`](skills/review/pr-comments/SKILL.md) | Write any comment on a PR: answer the comments left on your PR, tell the reviewer it is ready again or why something changed, or turn findings into comments on someone else's PR. Organic teammate voice, the mechanism behind every claim, a closing question only when a real decision belongs to the other person. Consolidates, gates on confirmation; never posts. |

### clean

| Skill | What it does |
|-------|--------------|
| [`leave-it-cleaner`](skills/clean/leave-it-cleaner/SKILL.md) | Boy Scout Rule, any language — after the asked task, make a cohesive, proportional, behavior-preserving cleanup of the zone you touched, and say what you did. |
| [`clean-comments`](skills/clean/clean-comments/SKILL.md) | Judgment authority on comments, any language — classifies each as noise / load-bearing / commented-out / out-of-domain via the surprise test and reason-token gate, then prescribes a remedy (delete / delete-comment-span / keep / keep-trim / keep-reformat / defer). Multi-line blocks are judged per segment, so a doc block mixing one why with three restatements is kept and trimmed, not preserved whole; a surviving comment documenting a declaration is flagged for its language's doc-block form (JSDoc, docstring, `///`, godoc). A caller-declared `fresh` / `established` provenance axis sets how strict the bar is. Judges and prescribes; never edits. |
| [`clean-names`](skills/clean/clean-names/SKILL.md) | Judgment authority on names, any language — classifies an identifier against Clean Code rules N1–N7 (descriptive, abstraction, standard, unambiguous, scope-length, no encoding, side-effect) and suggests a fix; defers TS type/signature/module concerns to the `ts-*` skills. Judges; never renames. |
| [`clean-functions`](skills/clean/clean-functions/SKILL.md) | Judgment authority on functions, any language — classifies against F2–F5 (output-arg mutation, flag arg, dead code, single-responsibility) and suggests a split boundary; arg-count (F1) defers to `ts-function-signatures` in TS, names/types defer to `clean-names` / `ts-*`. Judges; never edits. |
| [`clean-structure`](skills/clean/clean-structure/SKILL.md) | Judgment authority on the shape of a code body, any language — classifies against S1–S5 (duplication, magic value, obscured intent, repeated type switch, train wreck) and suggests a fix direction; names/types/comments/single-purpose defer to `clean-names` / `ts-*` / `clean-comments` / `clean-functions`. Judges; never edits. |

### workflow

| Skill | What it does |
|-------|--------------|
| [`slice-plan`](skills/workflow/slice-plan/SKILL.md) | Forecast the changed lines of a planned implementation BEFORE code exists — itemized per-file estimates against the review budget (default 400, user-overridable via invocation or project context) that `slice-diff` enforces after the fact. Over budget, plans slice boundaries (files and commits per slice, dependency order), names each slice's branch and base, states whether the chain will be grouped into the forge's native stack, and gates on confirmation; under it, states the total and steps aside. Plans only; never implements, never mutates git. |
| [`slice-diff`](skills/workflow/slice-diff/SKILL.md) | Slice an oversized git diff into a chain of reviewable PRs — pure git (no SDD), the review budget as the hard gate (default 400, user-overridable via invocation or project context), domain/layer as a soft cut signal, cut by commit boundary first. Shows the plan, gates on confirmation, then executes, grouping the chain into the forge's native stack where the client offers one. |
| [`browser-automation-safety`](skills/workflow/browser-automation-safety/SKILL.md) | Resource-safety rules loaded before any browser automation (Playwright, Puppeteer, browser MCP) — always tear down contexts, one browser instance, never full-page screenshots, mandatory timeouts, RAM-scaled concurrency — so a run never exhausts memory or leaks browser processes. A rules authority; never drives a browser. |
| [`verify-before-pr`](skills/workflow/verify-before-pr/SKILL.md) | Prove your own change works before the PR exists. Criteria come from the ticket or the ask, never from the code; each is walked on the running app by a context that never read the implementation and gets PASS, FAIL or NOT WALKABLE. Checks the diff for weakened tests and requires every new test to fail on the base commit. Packages SHA-stamped evidence under `.git/` with the command to attach it; never opens the PR, never fixes. |

## Authoring

`docs/skill-style-guide.md` is the normative style guide for skills in this repo.
Use the `skill-creator` skill to scaffold a new one and `skill-improver` to audit
it against the guide. Keep each skill's body within the guide's token budget and
put trigger words first in the `description`.

## License

Apache-2.0
