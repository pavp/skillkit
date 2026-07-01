---
name: clean-comments
description: "Trigger: judging if a comment is noise or load-bearing; \"is this comment useful\", \"why is this commented\", reviewing comments. Classifies each (noise / load-bearing / commented-out / trailing / out-of-domain); a judgment authority."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: 1.0.0
---

# Clean Comments

The judgment authority on whether a comment is noise or carries an irrecoverable WHY. Any language. It CLASSIFIES; it never deletes, scans, or edits — the calling actor decides what to do with the verdict.

## Activation Contract

Load to judge one or more comments: consulted by a cleanup actor (e.g. `leave-it-cleaner`), or invoked directly ("is this comment useful?", "why is this commented out?"). Not a scanner and not an editor — output is a classification, never an edit.

## Hard Rules

- **Judge, never act.** Emit a verdict per comment. Never delete, rewrite, or move a comment. Verbs are classify/keep/flag, never remove.
- **Default is no comment.** A comment earns its place only if a reader would be SURPRISED by the code without it (the surprise test). Restating the code = noise.
- **Delete bar = add bar. When unsure, classify toward load-bearing, never toward noise.** Deciding noise-vs-why is semantic; a wrong "noise" call loses a why forever. Uncertainty resolves to keep. If the referenced code is unavailable, the WHAT-restatement and obsolete tests cannot run — never emit `noise` on comment text alone; degrade to `load-bearing`.
- **Reason-token gate.** A comment naming a reason is NOT noise, even if it looks redundant. Tokens: `because`, `to avoid`, `so that`, `fails`, `bug`, `quirk`, `workaround`, `safe`, `instead`, `hack`, any proper noun naming an external system/library/browser/standard, a ticket id **cited as the reason** (`disabled per JIRA-123`), or any clause explaining WHY. Any present → load-bearing; unsure whether a word is such a name → load-bearing. Full list in `references/comment-criteria.md`. (A bare ticket id in an author/date run is metadata, not a reason.)
- **Trailing is structural, decided first.** A comment on the same physical line as code (`code; // x`) is `trailing` regardless of content — even a `// TODO` on a code line — because deleting the line takes the code. This lexical test runs before every other gate.
- **Judge blocks whole.** A multi-line or doc comment (`/* */`, JSDoc/TSDoc) is one unit: if any segment carries a why or reason token, the whole block is `load-bearing`.
- **Scaffolding is out of domain.** A standalone `// TODO`/`// FIXME` marker is neither noise nor a why — a task signal on another axis. Return `out-of-domain`.

## Decision Gates

Apply in order; first match wins.

| Comment shape | Verdict |
|---------------|---------|
| Shares a physical line with code (incl. a trailing `// TODO`) | `trailing` |
| Standalone `// TODO`/`// FIXME` work-pending marker | `out-of-domain` |
| Commented-out code | `commented-out` |
| Names a reason (reason-token gate) or is counterintuitive / a scar / a road-not-taken | `load-bearing` |
| Bare metadata: author / date / history / a ticket id NOT cited as a reason | `noise` |
| Restates the WHAT of nearby code, carries no why | `noise` |
| Referenced code is unavailable, OR any doubt a why exists / is still current | `load-bearing` (safe default) |
| Verifiably describes code that no longer exists / works differently AND carried no why to begin with | `noise` (obsolete) |

## Execution Steps

1. Isolate the comment and the code it refers to.
2. If it shares a physical line with code → `trailing`. Stop. (Runs first — lexical, overrides all below.)
3. If it is a standalone `// TODO`/`// FIXME` marker → `out-of-domain`. Stop.
4. If it is commented-out code → `commented-out`. Stop.
5. Run the reason-token gate and the three load-bearing cases — counterintuitive (a non-obvious choice), scar (a bug/quirk/workaround), road-not-taken (why an alternative was rejected); detail in `references/comment-criteria.md`. Any hit → `load-bearing`. Stop.
6. If bare metadata (author/date/history, or a ticket id not cited as a reason) → `noise`. Stop.
7. If the referenced code is unavailable, or any doubt a why exists → `load-bearing`. Stop.
8. Apply the surprise test: purely restates the WHAT of present code → `noise` (incl. verifiably obsolete with no why); otherwise → `load-bearing`.

## Output Contract

Per comment: `file:line` + verdict (`noise` / `load-bearing` / `commented-out` / `trailing` / `out-of-domain`) + a one-clause reason. No edits, no deletions — a classification the caller consumes. When the caller is a human asking directly, phrase the verdict and reason plainly.

## References

- `references/comment-criteria.md` — the surprise test in full, the three load-bearing shapes with examples, the complete reason-token list, the noise shapes (redundant / metadata / obsolete), and the trailing rule.
