# Finding Shape

The exact shape every lens emits each finding in. Same for all 6 lenses — only the lens name (and, for Spec, a `kind` tag) differs.

Output is plain Markdown (rendered in a terminal AND in GitHub PR comments) — there is **no text color**. Build visual hierarchy only with **bold**, blank lines, blockquotes (`>`), emoji, and `code spans`. Never claim or rely on color.

## Rich shape — 🔴 BLOCKER · 🟠 CRITICAL · 🟡 WARNING

Findings separated by a blank line, then `---`, then a blank line.

```
**<n>. <one-line problem statement>**
(`<Lens>` — `<path>:<line>` · <introduced|behavior-activated|pre-existing> · <harm>)

> **Why it matters:** <impact + the concrete mechanism — which input, path, or condition triggers the failure, not just that it can fail>
>
> **Evidence:**
> ```
> <the offending code or quoted line>
> ```

**→ Fix:** <one concrete, actionable change — name the function/guard/pattern, not a vague "consider validating">
```

Rules:

- The **bold title leads** — it answers "what is wrong", which is what a human scans for. The lens name, `file:line`, and causality tag go in parentheses on the next line; they are supporting metadata, not the headline.
- **Causality tag** (`introduced` / `behavior-activated` / `pre-existing`) is set by the emitting lens via changed-region membership (see `dispatch.md`'s causality contract). Only `pre-existing` is non-blocking; `introduced` and `behavior-activated` both block and stay in the severity sections. Spec findings carry NO causality tag — Spec is exempt. Whether a finding blocks depends on this tag, not on its severity alone. Code the diff moved or copied carries the long form `pre-existing (moved from <path>:<line>)`, the base line it cites (`dispatch.md`).
- **Harm label** — the last item of the parenthetical, exactly one of `security`, `data-loss`, `crash`, `wrong-result`, `degraded`, `untested`, `unclear`, `style`, meaning what the dispatch prompt defines. Name the worst harm the mechanism in `Why it matters` actually shows, on a realistic path. The lens never writes a severity: the orchestrator derives it from this label (`SKILL.md`'s harm table).
- **No severity emoji on the finding** — the `##` severity heading above it already states the severity; repeating it per finding is noise.
- A blank line separates every block; never run `Why it matters`, evidence, and `Fix` together as one paragraph.
- `Why it matters` and `Fix` are both required and stay separate: `Why it matters` is the mechanism (the *how* it breaks); `Fix` is the action (the *what to do*). Neither folds into the other.
- Add extra `>` sub-points (e.g. `> **Dangerous case:** …`) only when they aid clarity.
- **Spec only:** the parenthetical carries a `kind` tag before the harm — `(`Spec` — `<path>` · _missing | scope-creep | wrong | contradiction_ · <harm>)`; a `contradiction` is `unclear` — and `Evidence` is the quoted intent line, not code — for a `contradiction`, both sides it opposes (two intent lines, or an intent line and the diff line). Spec carries **no causality tag** (it is exempt), and Spec findings always stay in the severity sections, never the follow-up section.

## Refuted-by field (refuted findings only)

A refuted finding (`refute.md`) keeps its whole shape unchanged and gains ONE trailing blockquote. A refuter emits exactly this — no other shape — and the orchestrator appends it verbatim; when the counter-example came from the orchestrator's own inline read of a deterministic finding, the orchestrator authors this same block from that read. Either way the shape is identical:

```
> **Refuted by:** `<path>:<line>` — <the code or fact that disproves the finding, quoted>
> <one sentence: what the finding assumed that is not true>
```

A credential inside that quote is masked to `‹redacted›`, same as in a finding's own evidence.

## Compact shape — harm `style` (🔵 SUGGESTION)

`style` findings are nits; the full blockquote shape is overkill. Emit them compact — title line + a one-line `→ Fix`, no blockquote, no evidence:

```
**<n>. <one-line problem statement>** (`<Lens>` — `<path>:<line>` · <introduced|behavior-activated|pre-existing> · style)
**→ Fix:** <concrete action>
```

If a finding truly needs a mechanism or evidence to make sense, it is **not** `style` — name the harm that mechanism shows and use the rich shape.

A lens emits at most 3 `style` findings; the rest it counts in one closing line, `Omitted: <k> suggestions over the cap.` A finding relabelled away from `style` must show that other harm in its own `Why it matters` — never relabel one to escape the cap.

## Aggregation rules (when the orchestrator assembles the report)

- **Verbatim** — never reword, soften, or compress a finding to fit the list. Two exceptions, both stated here: a credential literal a lens quoted anyway is masked to `‹redacted›` before the finding goes anywhere, a refuter prompt included; and a Spec finding that quotes the same diff code as a code-lens finding is emitted in the compact form below — shortened by omitting blocks, never reworded.
- **Merge only the same defect** — two code-lens findings on the same path whose quoted evidence shares a code line, and whose Fixes make the same change to the same symbol or line (add, remove, or replace the same thing), are emitted as ONE finding in the merged shape below; showing one defect twice is noise for the reader. In doubt, keep two: a wrong merge hides a defect, a missed one only repeats it. Match on the quoted code, never on the cited line number: lenses misnumber lines by a few, the quoted code does not drift. Anything less is not a merge: the same code with a different Fix, or the same Fix on different code, stays two findings, and a related pair keeps a cross-reference ("see also #4"). Spec never merges — it is causality-exempt and never refuted, so a merged finding would break both. Instead, a Spec finding whose evidence quotes the same diff code as a code-lens finding is emitted **compact**, in its normal place: bold title, its parenthetical, the intent line it violates, and `Same code as #<n>` — no repeated mechanism, evidence, or Fix unless its Fix differs, then that Fix only.
- **Merged shape** — the rich or compact shape, with: the higher severity (its heading, its title, its Fix); both lenses in the parenthetical, in lens precedence order — (`` `Reliability` + `Resilience` — `<path>:<line>` · introduced ``); the stronger causality tag when the two differ (`introduced` over `behavior-activated` over `pre-existing` — fail toward blocking); each lens's harm label in lens precedence order when they differ (`· wrong-result [Risk] / crash [Resilience]`), the severity being the highest they map to; and each lens's `Why it matters` verbatim, labelled by lens, when the mechanisms differ — one when they match. Position within a severity follows the first lens in precedence. Recurrence stays visible as the two tags: it is still signal.
- **No rerank** — order within a severity by lens precedence (Risk → Readability → Reliability → Resilience → Architecture → Spec), never by importance. One lens's finding is never ranked above another's.
- **Causality partition** — only `pre-existing` findings move to the follow-up section (see `output-contract.md`); `introduced` and `behavior-activated` stay in the severity sections. Causality-based, not importance-based. The orchestrator never re-decides a lens's causality tag, with one check: a `moved from` base line is read at the base revision, and a citation that is missing or shows different behavior turns the finding back to `introduced` (fail toward blocking).
- **Refutation partition** — a blocking finding moves to the refuted section (see `refute.md`) only on a **cited counter-example**; it carries its refuter's evidence and its own text unchanged. Applied AFTER the causality partition and only to what still blocks, so no finding is ever both `pre-existing` and refuted.
- **Spec is exempt from both** — Spec findings carry no causality tag and are never refuted. They stay in the severity sections unconditionally; neither partition applies to them.
- A merged finding is partitioned and refuted once, as one finding; it is inferential when either source finding was.
- These two partitions, and the merge, are the ONLY permitted moves, and all are evidence-based, never importance-based. Nothing is ever dropped. What a partition may not alter is listed once in `refute.md` (Authority).

## Severity emoji (use exactly)

🔴 BLOCKER · 🟠 CRITICAL · 🟡 WARNING · 🔵 SUGGESTION

If a lens has nothing to report, it says exactly `No findings.`
