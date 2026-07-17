---
name: doc-generate
description: "Trigger: authoring agent-facing docs where none exist. Analyzes code, writes action-first docs for an LLM reader — every claim anchored to code, never inventing a WHY it can't prove. Use whenever agents lack written repo context: 'write the AGENTS.md/CLAUDE.md', 'generate a wiki', bootstrap /docs, 'agents keep misunderstanding this repo'. Updating existing docs → doc-sync."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.1"
---

## Activation Contract

Load when an LLM-facing doc must be CREATED where none exists: a context wiki (default `/docs`), or agent instructions — a doc a tool reads at runtime to act (e.g. `AGENTS.md`, `CLAUDE.md`, editor-rule/skill files) — by analyzing the project. Do NOT load to update a doc that exists (→ `doc-sync`) or to write for a human audience (out of scope; agent reader only). **Existence is per target file, not per directory:** each intended doc that exists → hand to `doc-sync`; generate only the missing.

## Hard Rules

- **Iron Law: NEVER STATE A WHY THE CODE DOES NOT PROVE.** Code shows WHAT, never WHY. **Structural test, not a word blocklist: a claim answering "why would someone do this" is WHY, whatever the phrasing.** A borderline claim → rephrase as pure behavior (keep as WHAT), omit, or mark `inferred — verify`. Also `inferred — verify` if you picked *this* fact for a motive you inferred — curation leaks WHY too. Fabricated rationale is worse than silence.
- **Every claim anchored** to where observed (`path:line`/`path:symbol`), captured before it becomes doc text. No anchor → don't write it. The report's anchor list is evidence, not narration.
- **`inferred — verify` is load-bearing** — exact literal (em dash `—`, never restyled), inline in the doc AND the report; a density pass MUST NOT drop it. At handoff, grep for that literal and report the count.
- **LLM-first + surprise test.** Write for an agent that ACTS: dense, imperative — commands, paths, signatures, conventions, boundaries; cut narrative/history/motivation. Keep a line only if a reader would be SURPRISED to lose it (the `clean-comments` bar).
- **Bounded, or STOP.** Scope caps WHICH files; depth caps HOW FAR: public API + DIRECT deps, no transitive/vendored recursion. Anchoring needs a transitive hop → `inferred — verify` or Out-of-scope, never extend silently. Huge scope → batch per module, checkpoint each. Code unreadable → say so; never guess.
- **Local text only.** Commit only on an affirmative SEPARATE from the generate request, never onto `main`. No push, no PR.

## Decision Gates

**Artifact gate — one engine, two output shapes:**

| Artifact | Content | Shape |
|----------|---------|-------|
| Agent instructions — doc a tool reads to act (e.g. `AGENTS.md`, `CLAUDE.md`, editor-rule/skill files) | build/test/run commands, conventions, non-negotiables, paths, tool names | short, always-in-context; ruthless density |
| Context wiki (default `/docs`, per-module) | architecture, module map, data flows, responsibilities, who-calls-whom | consulted on demand; may be longer, still anchored |

## Execution Steps

1. **Scope & targets.** Resolve the write path (user-named, else default `/docs`). Enumerate intended files deterministically (module rule in `methodology.md`); per file, existing → `doc-sync`, missing → generate. Report the path + split before writing.
2. **Analyze the WHAT** to the depth bound — entrypoints, structure, call graph, data flows, responsibilities. Record where each fact lives.
3. **Extract, anchor, filter.** Claims anchored at this step; apply the structural WHAT-vs-WHY test; drop what fails the surprise test.
4. **Write per artifact gate,** one file at a time, `inferred — verify` markers inline. Stop only at a file boundary — never mid-file.
5. **Handoff.** Grep files for `inferred — verify`, report count + files + anchors + any intended target not completed. Suggest a commit; never push or open a PR.

## Output Contract

Report:
- **Generated:** each file + a one-line note of what it documents.
- **Anchors:** claims tied to their source (`path:line`/`path:symbol`) — audit evidence.
- **Inferred — verify:** grep count + each unproven rationale, flagged for a human, never stated as fact.
- **Handed to `doc-sync`:** intended targets that already existed.
- **Unreadable:** code not analyzable (binary, generated) — named, not guessed.
- **Out of scope:** excluded by scope (files) or depth (transitive deps not traversed).
- **Not completed:** targets left ungenerated if the run stopped early — never reported as done or out-of-scope.

Never assert an unproven WHY as fact. Leave no speculative files in the tree.

## References

- `references/methodology.md` — the WHAT-vs-WHY line with examples, LLM-first writing patterns per artifact, the surprise test on generated docs, and the hallucinated-rationale tells that signal an unproven WHY.
