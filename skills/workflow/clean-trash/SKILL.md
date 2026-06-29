---
name: clean-trash
description: "Trigger: pre-commit, pre-PR, task done, before branch switch; clean dev artifacts; remove leftover console/debug/temp. Detect AI-left code and environment trash, report grouped, gate on confirmation, clean only what is confirmed."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: 1.0.0
---

Detect development artifacts left in a branch, group by type, gate on per-group confirmation, then clean only what was confirmed. Two scopes: code in the diff, trash in the working tree.

## Activation Contract

Load before a checkpoint where leftovers should not survive: a commit, a PR, task completion, or a branch switch. Run the scope that fits the context (see Decision Gates).

## Hard Rules

- **Require a git repo.** Verify it is a repo with a resolvable HEAD before scanning (preconditions in `detection-rules.md`). Not a repo / no commits / detached → ABORT with a named error. Never read git's empty output as a clean tree.
- **Gate before touching.** Scan and report first; clean only after unambiguous per-group confirmation. A vague reply, no reply, or consent inferred from an earlier turn is NOT confirmation. On any ambiguity, abort and change nothing.
- **Secrets are never auto-cleanable.** A git-ignored secret/data path is always report-only, regardless of ignored status — deleting it destroys local-only data. Patterns in `detection-rules.md`.
- **Diff scope for code.** Flag only ADDED lines in the diff and lines in new untracked code files. Base-branch code is intentional — never flag it.
- **Spare explicit intent.** Never flag `// keep`, `// intentional`, `eslint-disable`, or a standalone named logger. Raw `console.*` and `debugger` are fair game. Matching rules (incl. why `console.log` is not a logger) in `detection-rules.md`.
- **Git decides environment trash.** Auto-clean only git-ignored paths classified deny-by-default, deleted via explicit confirmed pathspecs (never a bare `git clean`). Untracked-but-not-ignored files are REPORTED, never deleted. Mechanic in `detection-rules.md`.
- **Never kill processes.** Stale servers/watchers are reported with PIDs only — no kill commands in the report.
- **Reversibility.** Flag auto-cleanable environment groups and uncommitted file edits as irreversible — surface them before the gate.

## Decision Gates

| Situation | Scope |
|-----------|-------|
| Diff present, or new untracked code files | Code scan on added lines. |
| Ignored build/cache output in tree | Environment scan; untracked-non-ignored files and suspect processes found are report-only. |
| Both | Run both scans; merge into one report (per-group gate preserved). |
| Nothing found | Say the branch is clean. Do not invent trash. |

## Execution Steps

1. Verify the git preconditions (Hard Rules). Abort on failure. Then determine scope from context (Decision Gates).
2. Run the applicable scans per `detection-rules.md`; collect findings with locus. Scan added diff lines AND new untracked code files for code artifacts; dedupe by `(file, line, content)`.
3. Group by type; tag each group auto-cleanable, report-only, or irreversible.
4. Present the grouped report (Output Contract); ask to confirm, adjust, or skip per group.
5. On confirmation, clean only confirmed auto-cleanable groups via the `detection-rules.md` mechanics. Echo a **Removed** section per `detection-rules.md`. Re-state report-only items as left untouched.

## Output Contract

A report grouped by finding type. Each group: a `###` heading, its risk class (auto-cleanable / report-only / irreversible), one line per finding (`file:line` for code, path or PID for environment). End with `---` and a one-line gate prompt naming the groups to be cleaned; report-only and irreversible groups are listed as untouched, never offered for deletion. After cleanup, append a **Removed** section (see `detection-rules.md`).

## References

- `detection-rules.md` — detection patterns, the added-lines + new-file scan, intent-marker matching, the secret-path blocklist, git-ignored vs untracked classification, and `git clean` mechanics with the post-clean receipt.
