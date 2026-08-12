# Finding Shape

The exact shape every lens emits each finding in. Same for all 6 lenses — only the lens name (and, for Spec, a `kind` tag) differs.

Output is plain Markdown (rendered in a terminal AND in GitHub PR comments) — there is **no text color**. Build visual hierarchy only with **bold**, blank lines, blockquotes (`>`), emoji, and `code spans`. Never claim or rely on color.

## Rich shape — 🔴 BLOCKER · 🟠 CRITICAL · 🟡 WARNING

Findings separated by a blank line, then `---`, then a blank line.

```
**<n>. <one-line problem statement>**
(`<Lens>` — `<path>:<line>` · <introduced|behavior-activated|pre-existing>)

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
- **Causality tag** (`introduced` / `behavior-activated` / `pre-existing`) is set by the emitting lens via changed-region membership (see `dispatch.md`'s causality contract). Only `pre-existing` is non-blocking; `introduced` and `behavior-activated` both block and stay in the severity sections. Spec findings carry NO causality tag — Spec is exempt. Whether a finding blocks depends on this tag, not on its severity alone.
- **No severity emoji on the finding** — the `##` severity heading above it already states the severity; repeating it per finding is noise.
- A blank line separates every block; never run `Why it matters`, evidence, and `Fix` together as one paragraph.
- `Why it matters` and `Fix` are both required and stay separate: `Why it matters` is the mechanism (the *how* it breaks); `Fix` is the action (the *what to do*). Neither folds into the other.
- Add extra `>` sub-points (e.g. `> **Dangerous case:** …`) only when they aid clarity.
- **Spec only:** the parenthetical carries a `kind` tag — `(`Spec` — `<path>` · _missing | scope-creep | wrong_)` — and `Evidence` is the quoted intent line, not code. Spec carries **no causality tag** (it is exempt): its parenthetical ends at the `kind`, and Spec findings always stay in the severity sections, never the follow-up section.

## Refuted-by field (refuted findings only)

A refuted finding (`refute.md`) keeps its whole shape unchanged and gains ONE trailing blockquote. A refuter emits exactly this — no other shape — and the orchestrator appends it verbatim; when the counter-example came from the orchestrator's own inline read of a deterministic finding, the orchestrator authors this same block from that read. Either way the shape is identical:

```
> **Refuted by:** `<path>:<line>` — <the code or fact that disproves the finding, quoted>
> <one sentence: what the finding assumed that is not true>
```

A credential inside that quote is masked to `‹redacted›`, same as in a finding's own evidence.

## Compact shape — 🔵 SUGGESTION

Suggestions are nits; the full blockquote shape is overkill. Emit them compact — title line + a one-line `→ Fix`, no blockquote, no evidence:

```
**<n>. <one-line problem statement>** (`<Lens>` — `<path>:<line>` · <introduced|behavior-activated|pre-existing>)
**→ Fix:** <concrete action>
```

If a suggestion truly needs a mechanism or evidence to make sense, it is **not** a suggestion — raise its severity to 🟡 and use the rich shape.

## Aggregation rules (when the orchestrator assembles the report)

- **Verbatim** — never reword, soften, or compress a finding to fit the list.
- **No dedupe** — if two lenses flagged the same issue, emit BOTH as separate numbered findings under the same severity; note the overlap ("also flagged by Spec, #4"). Recurrence across lenses is signal.
- **No rerank** — order within a severity by lens precedence (Risk → Readability → Reliability → Resilience → Architecture → Spec), never by importance. One lens's finding is never ranked above another's.
- **Causality partition** — only `pre-existing` findings move to the follow-up section (see `output-contract.md`); `introduced` and `behavior-activated` stay in the severity sections. Causality-based, not importance-based. The orchestrator never re-decides a lens's causality tag.
- **Refutation partition** — a blocking finding moves to the refuted section (see `refute.md`) only on a **cited counter-example**; it carries its refuter's evidence and its own text unchanged. Applied AFTER the causality partition and only to what still blocks, so no finding is ever both `pre-existing` and refuted.
- **Spec is exempt from both** — Spec findings carry no causality tag and are never refuted. They stay in the severity sections unconditionally; neither partition applies to them.
- These two partitions are the ONLY permitted moves, and both are evidence-based, never importance-based. Nothing is ever dropped. What a partition may not alter is listed once in `refute.md` (Authority).

## Severity emoji (use exactly)

🔴 BLOCKER · 🟠 CRITICAL · 🟡 WARNING · 🔵 SUGGESTION

If a lens has nothing to report, it says exactly `No findings.`
