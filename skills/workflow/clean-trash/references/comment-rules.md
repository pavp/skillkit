# Comment-noise rules

When clean-trash classifies a commented line, it decides whether the comment is **noise**
(adds nothing the code doesn't already say) or **load-bearing** (captures a WHY the code
cannot say for itself). This file is the judgment contract. The detection table in
`detection-rules.md` routes by the verdict reached here.

Comments cost attention and rot independently of the code they sit next to. A comment
earns its place only when it captures something the code cannot say for itself. AI agents
in particular over-produce comments — narrating the WHAT, restating names, leaving
"for later" blocks. This skill exists to catch that noise without stripping the rare
comment that carries an irreplaceable reason.

## The surprise test (the core decision)

The default is **no comment**. Before a comment earns its place, run the surprise test:
**would this surprise a competent reader of the code?** If not, it is noise.

A comment is load-bearing in exactly three cases:

1. **Counterintuitive** — the code does the opposite of what a reader would expect, and the
   comment explains why that is correct.
   _e.g. returning `false` (not retrying) when storage is unavailable — failing closed is
   the safe direction._
2. **A scar** — the code is shaped by a past bug, browser quirk, or library gotcha, and a
   well-meaning "cleanup" would reintroduce it.
   _e.g. `cssMinify: 'esbuild'` because lightningcss rejects CSS the project relies on._
3. **A road not taken** — the obvious approach was rejected for a non-obvious reason.
   _e.g. `satisfies` instead of `z.infer` to keep the public contract as the source of truth._

Then apply the discard filters — most candidate comments die here:

- **Would a good name carry it?** Then it is noise (the code should be renamed, not commented).
- **Can a competent reader deduce it from the code?** Then it is noise. Write for a
  competent reader, not a beginner.
- **Is it narrating the WHAT?** ("validate the shape", "consume the handoff") — noise; the
  code already says that.

If none of the three cases apply and the filters don't save it → **noise**.

## The delete bar is as high as the add bar (decisive for auto-clean)

Adding a comment requires a non-obvious why. **Deleting one requires the same scrutiny in
reverse**: can the code alone already tell me this? **If you cannot reconstruct the
comment's reason from the code, it is load-bearing — never auto-clean it.** When the reason
is unrecoverable, the comment is doing exactly the job these rules protect. Uncertainty
always resolves toward report-only, never toward deletion.

```ts
// A reload counter we cannot read OR write is treated as exhausted. Failing
// closed (the 401 screen) is the safe direction — an unwritable counter never
// advances, defeating the cap and producing the exact reload storm we guard against.
if (count === COUNTER_UNAVAILABLE) return false;
```
The code says "return false when the counter is unavailable." It does NOT say *why that is
the safe direction* — unrecoverable from the code. Load-bearing. Keep it.

## noise-auto — lexical, local, and only these two patterns

Auto-clean is reserved for noise decidable from the commented line plus its single adjacent
code line — NO judgment that requires reading elsewhere in the file. Only two patterns
qualify:

- **WHAT-narration of the very next line.** `const total = price * qty; // multiply price by quantity`.
- **A comment standing in for a name.** `const d = Date.now() - start; // elapsed time in ms` → the comment is a rename in disguise.

**The reason-token gate (mandatory before tagging noise-auto).** Even a matching comment is
NOT noise-auto if it contains any token that names a reason: `because`, `to avoid`, `so that`,
`fails`, `bug`, `quirk`, `workaround`, `safe`, `instead`, `hack`, a browser or library name,
a ticket/PR id, or any clause explaining WHY. Any such token → demote to `noise-proposed`.
This converts "no chance of a hidden why" into an inspectable test.

Worked contrast:
- `// elapsed time in ms` → noise-auto (names a unit, not a reason).
- `// ms, not s — the vendor clock reports seconds` → noise-proposed (`the vendor clock` is a reason).

## noise-proposed — looks removable, might carry a why (report-only)

Everything that smells like noise but is not lexical-and-local goes here. Report it with both
the reason it looks removable and the reason to keep; never auto-delete.

- **Restating a header or a symbol's JSDoc.** Requires comparing another region of the file —
  semantic, not local. A JSDoc that looks redundant may document a `@throws`, a unit, or a
  constraint absent from the signature.
- **Section/step labels** (`// --- setup ---`, `// validate`). Only noise if the adjacent code
  unambiguously is that step — a judgment about other code.
- **Comments leaning on process artifacts** (`see §5`, `PR 2`, `ACTO-1234`, scenario ids).
  A smell, but the reasoning they point at may be load-bearing.
- **Anything where the why might be unrecoverable** (the delete-bar rule above).

## commented-out code — always report-only

Commented-out code and "for later" blocks read as noise, but are **never** `noise-auto`
regardless of the surprise test — deleting them can destroy an in-progress idea the author
meant to restore. Always report-only; let the user decide.

## Output of this judgment

Classify each commented finding into exactly one of:

- **noise-auto** — matches one of the two lexical-local patterns AND passes the reason-token
  gate. Auto-cleanable (still gated).
- **noise-proposed** — looks like noise but is semantic, artifact-bound, or might carry a why.
  Report-only.
- **commented-out** — commented-out code / dead code. Report-only, never noise-auto.
- **load-bearing** — reason not reconstructable from the code. Keep.

**Observability of kept decisions.** A comment that MATCHED a noise pattern but was spared as
`load-bearing` is surfaced in a compact `kept (load-bearing)` line in the report — not deleted,
but shown so the user can veto a wrong spare-or-delete call BEFORE the gate. This is the only
window on misclassification in the dangerous direction; do not suppress it.
