---
name: clean-trash
description: "Trigger: pre-commit, pre-PR, task done, before branch switch. Detect debug artifacts in the diff (console/debugger), report grouped, gate, auto-clean only confirmed debug logging and breakpoints."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: 2.0.0
---

Detect debug artifacts left in a branch's diff, group them by type, gate on per-group confirmation, then auto-clean only the debug logging and breakpoints that were confirmed. Scope is the diff only — added lines and new untracked code files.

## Activation Contract

Load before a checkpoint where debug leftovers should not survive: a commit, a PR, task completion, or a branch switch.

## Hard Rules

- **Require a git repo.** Verify the preconditions in `references/detection-rules.md` before scanning. Not a repo / no commits / detached-unresolvable → ABORT with a named error. Never read git's empty output as a clean tree.
- **Gate before touching.** Scan and report first; clean only after unambiguous per-group confirmation. A vague reply, no reply, or consent inferred from an earlier turn is NOT confirmation. On any ambiguity, abort and change nothing.
- **Diff scope only.** Flag only ADDED lines in the diff and lines in new untracked code files. Base-branch code is intentional — never flag it. This skill never touches the working tree beyond deleting confirmed debug lines, and never touches ignored files or processes.
- **Spare explicit intent.** Never flag `// keep`, `// intentional`, `eslint-disable`, or a named logger (receiver is `log`/`logger`, not `console`). Raw `console.*` and `debugger` are fair game. Matching in `references/detection-rules.md`.
- **Auto-clean is debug-only and statement-level.** Only `console.*` and breakpoints that are self-contained statements are auto-cleanable. A debug call embedded in a larger expression is report-only. Everything else is report-only — intent is not decidable from the diff alone.
- **Deletion is irreversible for uncommitted lines.** Deleting an added line that was never committed cannot be undone via git. Surface this per group BEFORE the gate. Apply deletions per the deletion mechanic in `references/detection-rules.md` (statement-span, content-anchored, bottom-up, partial-failure guard).

## Decision Gates

| Situation | Action |
|-----------|--------|
| Diff present, or new untracked code files | Scan added lines + new files; report and gate. |
| Nothing found | Say the branch is clean. Do not invent trash. |

## Execution Steps

1. Verify the git preconditions (`references/detection-rules.md`). Abort on failure.
2. Scan added diff lines AND new untracked code files; collect findings with `file:line` + content; dedupe by `(file, line, content)`.
3. Group by type; tag each group auto-cleanable or report-only.
4. Present the grouped report (Output Contract); surface irreversibility per group; ask to confirm, adjust, or skip per group.
5. On confirmation, delete only the confirmed auto-cleanable statements via the deletion mechanic. Re-state report-only items as left untouched. Append a **Removed** section.

## Output Contract

A report grouped by finding type. Each group: a `###` heading, its risk class (auto-cleanable / report-only), one line per finding (`file:line`). End with `---` and a one-line gate prompt naming the groups to be cleaned; report-only groups are listed as untouched, never offered for deletion. After cleanup, append a **Removed** section recording each deleted line's `file:line` and verbatim content; on partial failure, include the mixed-state warning. Shape and rules in `references/detection-rules.md`.

## References

- `references/detection-rules.md` — preconditions, the added-lines + new-file scan, code-type extensions, the spare list and named-logger receiver rule, artifact types with per-language breakpoint guards, the line-deletion mechanic (statement-span / content-anchored / bottom-up / partial-failure), reversibility, and the Removed-receipt contract.
