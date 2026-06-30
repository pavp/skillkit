# clean-trash detection rules

Detail for the `clean-trash` skill. Scope is the diff only: added lines and new untracked code files. The skill body holds the gate and risk contract; this file holds what to match, how to classify, and how to delete.

## Preconditions

Before any scan, verify `git rev-parse --is-inside-work-tree` succeeds and `git rev-parse HEAD` resolves. If not a repo, no commits yet, or detached/unresolvable base, abort with a named error — never treat git's empty output as a clean tree.

## Scope — added and new-file lines

Two sources, because `git diff` alone misses new files:

- **Tracked changes:** `git diff` (unstaged) and `git diff --cached` (staged); consider only lines prefixed `+` (excluding the `+++` header).
- **New untracked code files:** for each `??` path (from `git status --porcelain=v1`) whose extension is a code type, scan the whole file — every line is "added". A new `utils.ts` with a `console.log` is invisible to `git diff`; this catches it.

Use `--porcelain=v1` explicitly on every `git status` call — `v2` (a possible default) changes the prefix format and breaks `??` matching.

Dedupe candidates by `(file, line, content)` before grouping — a line can surface in both `git diff` and `git diff --cached`. Lines already on the base branch are intentional and out of scope.

### Code-type extensions

A `??` path is in scope only if its extension is a code type. Allowlist (non-exhaustive; extend per project):
`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.vue`, `.svelte`, `.py`, `.rb`, `.go`, `.rs`, `.java`, `.kt`, `.php`, `.c`, `.cc`, `.cpp`, `.h`, `.hpp`, `.cs`, `.swift`, `.scala`.
Never scan as code: `.md`, `.json`, `.lock`, `.txt`, `.yaml`, `.yml`, `.toml`, `.csv`, `.svg`, images, binaries.

## Spare list (never flag, even when added)

A candidate is spared if its line carries any of:

- `// keep`, `// intentional`, `/* keep */` or equivalent in the file's comment syntax.
- An `eslint-disable` / `eslint-disable-next-line` directive.
- A **named-logger** call. Decide by RECEIVER, not by substring: resolve the identifier the `.log`/`.info`/… call is invoked on. Spare it when the receiver is `log`, `logger`, `this.log`, or `this.logger`. The receiver check is authoritative and overrides any substring match — `console.log` is always flagged because its receiver is `console`, even though the string `log.` appears inside it.

## Artifact types

| Type | Match (on in-scope lines) | Risk |
|------|---------------------------|------|
| Debug logging | Raw `console.log/info/debug/warn/error` whose receiver is `console` | auto-cleanable |
| Breakpoints | `debugger;` (any JS/TS file); `breakpoint()` only in `.py`; `binding.pry` only in `.rb` | auto-cleanable |
| Comment noise | Any added comment. Classify with `comment-rules.md`: `noise-auto` (one of two lexical-local patterns AND passes the reason-token gate), `noise-proposed` (semantic / artifact-bound / maybe-why), `commented-out` (dead code), or `load-bearing` (keep). | `noise-auto` → auto-cleanable (still gated); `noise-proposed` and `commented-out` → report-only; `load-bearing` → not listed, but surfaced as `kept (load-bearing)` if it matched a pattern |
| Dead imports/vars | Imports or local bindings added but unreferenced in the same file. SPARE: re-exports (`export { X }`), side-effect imports (`import 'x'`), and type-only imports used in annotations/JSDoc — valid despite no local reference | report-only (may be used elsewhere; verify) |

`debugger;` is unambiguous in JS/TS and auto-cleanable anywhere. `breakpoint()` and `binding.pry` are auto-cleanable ONLY in their language's files — bare `breakpoint()` is a valid identifier elsewhere (CSS-in-JS helpers, user functions) and would be a false positive. Everything outside the two auto-cleanable rows is report-only because intent is not decidable from the diff alone.

## Deletion mechanic (only after confirmation, only for auto-cleanable types)

Auto-clean DELETES lines from working-tree files (a `console.*`/breakpoint statement, or a `noise-auto` comment line). Lines are anchored by `(file, content)`, never by line number alone — line numbers drift as edits apply.

1. **Statement-level only.** An auto-clean candidate must occupy its own line(s) — a self-contained statement, or a standalone comment. A `console.*`/breakpoint embedded in a larger expression (`const x = console.log(y) || z`, `arr.map(x => console.log(x))`) is NOT auto-cleanable — downgrade it to report-only. A trailing comment sharing a line with code (`const x = 1; // noise`) is report-only, never auto-deleted — removing the line would take the code with it.
2. **Full span — code and comments.** Delete the entire span, never one line of it:
   - A multi-line statement (`console.log(\n  foo,\n  bar\n);`) — delete through its terminator.
   - A block comment — delete from its opening delimiter (`/*`, `/**`, `<!--`, `"""`) through its closing delimiter inclusive.
   - A run of consecutive single-line comments (`//`, `#`) the classifier judged as one noise unit — delete as one contiguous block.
   If the full span cannot be bounded unambiguously, downgrade to report-only. The anchor for a multi-line target is its FULL multi-line content, not the first line.
3. **Apply bottom-up with content verification.** Within a file, delete in descending line order. Before deleting, verify the line(s) at the target still match the anchored content — if not (line drifted, file changed), abort that instance and report it unresolved. For duplicated identical content (e.g. three `// validate` lines), this descending-order + verify-at-line rule disambiguates which instance is deleted; content alone cannot.
4. **Partial-failure guard.** The operation is NOT atomic. If any confirmed deletion fails, STOP — do not continue deleting. Report which lines were removed vs. which were not, and state the working tree is now in a mixed state. Never emit a clean **Removed** receipt over a partial edit.

## Reversibility

Deleting a line edits the working tree. Recovery depends on git history, NOT on whether the line is currently staged:

- A line that exists in a **prior commit** is recoverable (`git checkout`/`git restore`/reflog) even after deletion.
- A line that is **uncommitted** — an unstaged added line, or any line in a new untracked file — is NOT recoverable via git once deleted; git never stored it.

Because this skill targets ADDED lines, most auto-clean targets are uncommitted and therefore irreversible via git. Surface this per group BEFORE the gate so the user consents knowing the risk.

## Reporting contract

- Group findings by type. Tag each group **auto-cleanable** or **report-only**.
- Report-only groups are always listed as left untouched — never offer them for deletion, never include them in the "will clean" set.
- The gate prompt names exactly which groups get cleaned on confirmation; nothing outside that set is touched.
- A comment that matched a noise pattern but was spared as `load-bearing` is listed in a compact `kept (load-bearing)` line before the gate, so the user can veto a misclassification in the dangerous direction.
- After cleanup, the **Removed** section records, per deleted line, its `file:line` AND the verbatim original content. For uncommitted (irreversible) deletions this receipt is the ONLY manual-undo path — the content is mandatory, not optional.
- On partial failure, the **Removed** section reflects only what was actually deleted and is accompanied by the mixed-state warning (deletion mechanic, step 4).
