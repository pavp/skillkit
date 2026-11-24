# Output Contract

How the orchestrator assembles the final report after every dispatched lens returns. Findings are grouped by **severity**, not lens; each finding still carries its originating lens. Emit these parts in order: the decision first, coverage last, in one line.

## 1. Lead, verdict, fix first

The reader decides from these lines before reading any finding:

1. 1–2 sentences, no list: what was reviewed (fixed point + file count) and the single worst thing found, in plain language.
2. `**Verdict:**` — one sentence, the merge call per §6's rules. It never re-lists the numbers `Fix first` already shows.
3. `**Fix first**` — one line per unrefuted 🔴/🟠 finding, in report order: `#<n> · <title> · <path:line>`. Above 5 entries, list only the 🔴 ones and end with `+<k> 🟠 below` — a cut by severity band, never a ranking. Omit it when there is none.

## 2. Findings by severity

One `##` heading per severity **present**, highest first: `🔴 BLOCKERS` → `🟠 CRITICAL` → `🟡 WARNING` → `🔵 SUGGESTION`. Omit a severity with no findings. These sections hold every **unrefuted blocking** finding — `introduced` and `behavior-activated`, plus all Spec findings (causality-exempt and never refuted, so they stay here unconditionally); `pre-existing` findings go to §3 and refuted ones to §3.5. Number findings continuously across the whole report — the first is `1.` whatever its severity; numbering never resets per heading. Each finding is the lens's own text in the `finding-shape.md` shape, ordered within a severity by lens precedence (Risk → Readability → Reliability → Resilience → Architecture → Spec). The verbatim / merge-only-the-same-defect / no-rerank rules live in `finding-shape.md`.

## 3. Pre-existing (follow-up, optional)

A `## 📝 Pre-existing (follow-up)` section for findings tagged `pre-existing` — defects the diff did not introduce (evidence outside every changed region, or moved unchanged from a cited base line). Lead line: "Not introduced by this diff — reported, does not block." List them verbatim in the `finding-shape.md` shape, each keeping its **real severity emoji inline** on the title, grouped by severity then lens precedence. Continue the report's running number. Omit the whole section if no finding is `pre-existing`. These never contribute to a blocking Verdict.

## 3.2 Addressed elsewhere (optional)

A `## 🔗 Addressed elsewhere` section for blocking findings a PR stacked on this one already fixes (`SKILL.md` PR context). Lead line: "Answered later in this stack — does not block unless this PR merges without it." Each finding is its title line only, with its **real severity emoji inline** and its parenthetical, then its receipt — its mechanism and Fix are already answered:

```
**<n>. 🟠 <title>** (`<Lens>` — `<path>:<line>` · introduced · <harm>)
> **Addressed:** fixed in #<m> — `<path>:<line>` `<quoted code at #m's head>`
```

A deferral in the description is not a fix and never lands here: that finding stays blocking, tagged. Group by severity then lens precedence; continue the report's running number. Omit the whole section when nothing moved.

## 3.5 Refuted (optional)

A `## 🤔 Refuted (needs a second look)` section for blocking findings disproved with a citation (`refute.md`) — by a refuter, or by the orchestrator's own inline verification of a deterministic finding. Lead line: "Evidence was found against these — reported, does not block." List them verbatim in the `finding-shape.md` shape, each keeping its **real severity emoji inline** on the title, grouped by severity then lens precedence, continuing the report's running number. Append the **Refuted-by** blockquote — verbatim from the refuter, or authored by the orchestrator from its inline read; that field's shape is defined in `finding-shape.md` and is the same either way.

Omit the whole section if nothing was refuted. Never contributes to a blocking Verdict. If refutation was skipped or only partially completed, omit or shorten this section accordingly and record the counts in §5 — unrefuted findings always stay in §2.

## 4. Verified OK (optional)

A `## ✅ Verified OK` section: bullets of what a lens **actively checked and cleared** — not mere silence. Each bullet names the lens and what it confirmed (e.g. "Risk: no injection, prototype pollution, ReDoS, or secrets"; "Spec: 8 keys exist in en/es/fr, 1:1 migration, no lost defaultMessage"). Omit the section if no lens reports positive verification; never pad it.

## 5. Coverage

One line, literally one — never a heading, a list, or an explanation — and nothing after it:

`**Coverage:** <n> lenses ran · clean: <Lens>, … · skipped: <Lens> (<reason>) · refutation <challenged M of M: N by refuter, K inline | challenged N of M: … — unrefuted: #a, #b> · <k> suggestions omitted (<Lens>) · PR context: <checked #m, #p | not checked (<reason>)> · <B> blocking findings: consider slice-diff`

`<n> lenses ran` and the refutation part always appear; every other part only when it applies — `clean` when a lens returned `No findings.`, `skipped` when the applicability gate skipped a lens or there was no spec (`Spec (no spec)`), `suggestions omitted` when a lens hit the 🔵 cap, `PR context` when the range is a PR, the slice-diff part above the split gate (`SKILL.md` step 5). Keep clean and skipped apart: a clean lens looked and found nothing, a skipped lens never looked. The refutation part keeps the two kinds of challenge apart — a refuter searched for counter-evidence, an inline check only confirmed the cited lines say what the finding claims — and names by number each blocking finding never challenged, since those are the findings to trust less. Refutation that never ran reads `refutation skipped — unrefuted: #a, …`.

Merges and line corrections are not reported: a merged finding shows its lens tags, and a corrected line is just the line.

## 6. Verdict rules

The verdict is emitted in §1, not at the end: a plain-language merge call that points at `Fix first` when that list shows the blocking findings ("Don't merge until the Fix first items are resolved"), and names by number only the blocking findings `Fix first` does not show ("…and #9"). **Derived, not editorial** — it may only point at findings already listed, in their real severities, and may not silence or downgrade any lens. It counts every **unrefuted blocking** finding — `introduced` and `behavior-activated`, plus Spec: a report whose sole 🔴/🟠/🟡 are `pre-existing` or refuted has no blocking verdict — say so ("nothing this diff introduced blocks; N pre-existing and M refuted item(s) noted for follow-up"). Findings in §3.2 never block; when one or more moved there, name the PRs they wait on ("2 more are fixed in #285 — merge this PR with it"). Omit if nothing blocks.

## All clean

If every **dispatched** lens is clean: emit the human lead, skip the severity headings, state `All <n> dispatched lenses clean — no findings.` with `<n>` the count that actually ran, and still emit the coverage line. A skipped lens NEVER satisfies "clean" — when any lens was skipped, this branch's coverage line must carry its `skipped` part, and the literal "All 6" is forbidden. Never collapse to a bare "all good".
