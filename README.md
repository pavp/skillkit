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

### workflow

| Skill | What it does |
|-------|--------------|
| [`review-6-lens`](skills/workflow/review-6-lens/SKILL.md) | Review a diff across 6 isolated lenses — Risk, Readability, Reliability, Resilience, Architecture and Spec — and report each separately. Every blocking finding is then challenged by an independent refuter; a finding only stops blocking on a cited counter-example, and nothing is ever dropped. |
| [`pr-review`](skills/workflow/pr-review/SKILL.md) | Review someone else's PR end-to-end and leave one consolidated comment on it. Orchestrates only: `review-6-lens` judges, you pick which findings become comments, `review-comments` writes them. Nothing posts unconfirmed. |
| [`review-comments`](skills/workflow/review-comments/SKILL.md) | Handle reviewer comments on your PR and reply to feedback — fires the moment comments need a written response, even after you fix the flagged code. Organic teammate voice, the mechanism behind every claim, a closing question only when a real decision belongs to the other person. Consolidates, gates on confirmation; never posts. |
| [`leave-it-cleaner`](skills/workflow/leave-it-cleaner/SKILL.md) | Boy Scout Rule, any language — after the asked task, make a cohesive, proportional, behavior-preserving cleanup of the zone you touched, and say what you did. |
| [`clean-comments`](skills/workflow/clean-comments/SKILL.md) | Judgment authority on comments, any language — classifies each as noise / load-bearing / commented-out / trailing / out-of-domain via the surprise test and reason-token gate. Judges; never deletes. |
| [`clean-names`](skills/workflow/clean-names/SKILL.md) | Judgment authority on names, any language — classifies an identifier against Clean Code rules N1–N7 (descriptive, abstraction, standard, unambiguous, scope-length, no encoding, side-effect) and suggests a fix; defers TS type/signature/module concerns to the `ts-*` skills. Judges; never renames. |
| [`clean-functions`](skills/workflow/clean-functions/SKILL.md) | Judgment authority on functions, any language — classifies against F2–F5 (output-arg mutation, flag arg, dead code, single-responsibility) and suggests a split boundary; arg-count (F1) defers to `ts-function-signatures` in TS, names/types defer to `clean-names` / `ts-*`. Judges; never edits. |
| [`clean-structure`](skills/workflow/clean-structure/SKILL.md) | Judgment authority on the shape of a code body, any language — classifies against S1–S5 (duplication, magic value, obscured intent, repeated type switch, train wreck) and suggests a fix direction; names/types/comments/single-purpose defer to `clean-names` / `ts-*` / `clean-comments` / `clean-functions`. Judges; never edits. |
| [`slice-diff`](skills/workflow/slice-diff/SKILL.md) | Slice an oversized git diff into a chain of reviewable PRs — pure git (no SDD, no config), >400 lines as the hard gate, domain/layer as a soft cut signal, cut by commit boundary first. Shows the plan, gates on confirmation, then executes. |
| [`browser-automation-safety`](skills/workflow/browser-automation-safety/SKILL.md) | Resource-safety rules loaded before any browser automation (Playwright, Puppeteer, browser MCP) — always tear down contexts, one browser instance, never full-page screenshots, mandatory timeouts, RAM-scaled concurrency — so a run never exhausts memory or leaks browser processes. A rules authority; never drives a browser. |
| [`diagnose-fix`](skills/workflow/diagnose-fix/SKILL.md) | Resolve a concrete defect from any source (tracker, traceback, description) via a gated four-phase engine — reproduce → root-cause → hypothesis → fix + regression test — under the Iron Law (no fix without a reproduced failure and a named cause). Routes design gaps out (undefined behavior isn't a bug) and only suggests opening a PR. An actor; fixes, but never mutates remote state. |
| [`doc-sync`](skills/workflow/doc-sync/SKILL.md) | Reconcile existing docs with code that changed under them — patches a doc claim (command, signature, path, count) the code provably contradicts, under an Iron Law (no edit without a hard contradiction). Two gates: audience (agent-facing docs aggressively, human-facing conservatively) and scope (diff vs. doc-set audit). Never overwrites a narrated WHY — that's `Needs-decision`. An actor; local edits only, never pushes. |
| [`doc-generate`](skills/workflow/doc-generate/SKILL.md) | Generate LLM-first docs from scratch where none exist — a context wiki or agent instructions (`AGENTS.md`/`CLAUDE.md`) — by analyzing the code. Every claim is anchored to where it was observed; under an Iron Law it never asserts a WHY the code can't prove (fabricated rationale is flagged `inferred — verify`, not stated). Dense and action-first for an agent reader. Updating existing docs → `doc-sync`; human-facing prose is out of scope. An actor; local writes only, never pushes. |

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

### Recommended bundle: cleanup

`leave-it-cleaner` works standalone, but it consults the `clean-*` judgment
skills when they are installed — each judge is also independently useful on its
own. To install the full cleanup family:

```bash
npx skills add pavp/skillkit -s leave-it-cleaner -s clean-comments -s clean-names -s clean-functions -s clean-structure -a claude-code
```

## Authoring

`docs/skill-style-guide.md` is the normative style guide for skills in this repo.
Use the `skill-creator` skill to scaffold a new one and `skill-improver` to audit
it against the guide. Keep each skill's body within the guide's token budget and
put trigger words first in the `description`.

## License

Apache-2.0
