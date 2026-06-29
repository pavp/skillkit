# clean-trash detection rules

Detail for the `clean-trash` skill. Two scopes: code in the diff, trash in the working tree. The skill body holds the gate and risk contract; this file holds what to match and how to classify.

## Code scope — added and new-file lines

Two sources, because `git diff` alone misses new files:

- **Tracked changes:** `git diff` (unstaged) and `git diff --cached` (staged); consider only lines prefixed `+` (excluding the `+++` header).
- **New untracked code files:** for each `??` path (from `git status --porcelain=v1`) whose extension is a code type, scan the whole file — its every line is "added". A new `utils.ts` with a `console.log` is invisible to `git diff`; this catches it.

Dedupe candidates by `(file, line, content)` before grouping — a line can surface in both `git diff` and `git diff --cached`. Lines already on the base branch are intentional and out of scope.

### Spare list (never flag, even when added)

A candidate is spared if its line carries any of:

- `// keep`, `// intentional`, `/* keep */` or equivalent in the file's comment syntax.
- An `eslint-disable` / `eslint-disable-next-line` directive.
- A **named-logger** call: spare a line if it contains `log.`, `logger.`, `this.log.`, or `this.logger.` where the receiver is not `console`. The rule is: flag `console.*` always; spare `log.`/`logger.` only when not preceded by an identifier that makes it part of a different receiver (e.g. `console.log` stays flagged because its receiver is `console`). Matching: `(?<![A-Za-z0-9])log\.` catches standalone `log.` and `this.log.`; `this.logger.` and `logger.` are literal anchors in the spare list.

### Code artifact types

| Type | Match (on in-scope lines) | Risk |
|------|------------------------|------|
| Debug logging | Raw `console.log/info/debug/warn/error`, `debugger` adjacent calls | auto-cleanable |
| Breakpoints | `debugger;`, `breakpoint()`, `binding.pry` | auto-cleanable |
| Print probes | `print(`/`println`/`fmt.Println`/`dbg!` | report-only (may be legit program output; intent not decidable from a diff) |
| Commented-out test code | New comment blocks wrapping code (assignments, calls, JSX), not prose | report-only (intent ambiguous) |
| Fake/placeholder TODO | `TODO`/`FIXME` with no ticket ref and generic text (`TODO: fix this`, `TODO: remove`) added in this diff | report-only |
| Dead imports/vars | Imports or local bindings added but unreferenced in the same file. SPARE: re-exports (`export { X }`), side-effect imports (`import 'x'`), and type-only imports used in annotations/JSDoc — these have no local reference yet are valid | report-only (may be used elsewhere; verify) |

Debug logging and breakpoints are the ONLY auto-cleanable code groups — mechanical and reversible via diff. Everything else is report-only because intent is not decidable from the diff alone.

## Preconditions

Before any scan, verify `git rev-parse --is-inside-work-tree` succeeds and `git rev-parse HEAD` resolves. If not a repo, no commits yet, or detached/unresolvable base, abort with a named error — never treat git's empty output as a clean tree.

## Environment scope — working tree

Use `--porcelain=v1` explicitly on every `git status` call — `v2` (a possible default) changes the prefix format and breaks `!!`/`??` matching.

### Classification

Classify deny-by-default: a `!!` path is auto-cleanable ONLY if it is provably build output / cache / temp. Anything else — including anything secret-shaped or that you cannot confidently classify — is report-only.

1. **git-ignored, provably disposable** (`git status --ignored --porcelain=v1`, lines starting `!!`): build output, caches, temp. Auto-cleanable AFTER gate. Examples by ecosystem: `dist/`, `build/`, `out/`, `.next/`, `.turbo/`, `coverage/`, `.cache/`, `__pycache__/`, `*.pyc`, `target/`, `.pytest_cache/`, `node_modules/` only if ignored.
2. **git-ignored secret/data, or uncertain** — REPORT only, tagged irreversible. Being git-ignored does NOT make it disposable; these hold local-only data with no recovery path. The blocklist `*.env*`, `*.sqlite*`, `*.db*`, `secrets.*`, `credentials.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.keystore`, `id_rsa*`, `*.tfstate*`, `.netrc` is a NON-EXHAUSTIVE floor — also treat as report-only anything matching a `*secret*`/`*credential*`/key/certificate/local-DB/state shape, or any ignored path you cannot place confidently in group 1. Never auto-clean.
3. **untracked, not ignored** (`git status --porcelain=v1`, lines starting `??`): REPORT only. These may be the user's scratch, a new file they forgot to add, or real trash — the skill cannot tell. List paths; propose nothing.
4. **stale processes**: dev servers, watchers, test runners left running (`vite`, `webpack`, `next dev`, `jest --watch`, `nodemon`, `tsc -w`). REPORT PID + command only. Never kill, never emit a `kill` command in the report.

### Cleanup mechanics (only after confirmation, only for git-ignored non-secret paths)

1. Run `git clean -Xd --dry-run` to enumerate the full git-ignored candidate set (capital `-X` = ignored only; never lowercase `-x`, which also removes untracked). This list is authoritative — show it in the report before the gate.
2. **ABORT-GUARD:** scan the dry-run output against the classification above. The cleanable set is the group-1 paths the user confirmed at the gate — build only by positive selection, never by subtracting secrets from the dry-run dump (subtraction lets an unlisted secret-shaped path slip through).
3. **NEVER run a bare `git clean -Xd -f`.** Delete ONLY the confirmed group-1 paths, passed as explicit pathspecs: `git clean -Xfd -- <path1> <path2> ...` (`-f` is the only addition over the dry-run flags). Anything not named is untouched. Before the force run, re-scan `git clean -Xd --dry-run -- <those paths>` against the blocklist; if any secret-shaped path appears (a secret nested under a confirmed directory), drop that directory and re-state it report-only.
4. The operation is NOT atomic: capture stdout and echo it as a **Removed** section. On non-zero exit, or if any removed path is NOT a member of the confirmed pathspec set, surface "partial deletion — state unknown". Directory-vs-contents expansion within a confirmed path is expected and does NOT trigger this warning.

## Reporting contract

- Group findings by type. Tag each group: **auto-cleanable**, **report-only**, or **irreversible**.
- Secret/data paths (classification 2) and any `git clean` group are **irreversible** — these cannot be undone and are surfaced before the gate.
- Report-only and secret/irreversible groups are always listed as left untouched — never offer them for deletion, never include them in the "will clean" set.
- The gate prompt names exactly which groups get cleaned on confirmation; nothing outside that set is touched.
- After cleanup, the **Removed** section reflects the command's actual output, not the predicted set.
