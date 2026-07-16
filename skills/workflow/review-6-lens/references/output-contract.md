# Output Contract

How the orchestrator assembles the final report after the 6 lenses return. Findings are grouped by **severity**, not lens; each finding still carries its originating lens. Emit these parts in order.

## 1. Human lead

1–2 sentences: what was reviewed (fixed point + file count) and the single worst thing found, in plain language.

## 2. Findings by severity

One `##` heading per severity **present**, highest first: `🔴 BLOCKERS` → `🟠 CRITICAL` → `🟡 WARNING` → `🔵 SUGGESTION`. Omit a severity with no findings. These sections hold every **blocking** finding — `introduced` and `behavior-activated`, plus all Spec findings (causality-exempt); only `pre-existing` findings go to §3. Number findings continuously across the whole report — the first is `1.` whatever its severity; numbering never resets per heading. Each finding is the lens's own text in the `finding-shape.md` shape, ordered within a severity by lens precedence (Risk → Readability → Reliability → Resilience → Architecture → Spec). The verbatim / no-dedupe / no-rerank rules live in `finding-shape.md`.

## 3. Pre-existing (follow-up, optional)

A `## 📝 Pre-existing (follow-up)` section for findings tagged `pre-existing` — defects the diff did not introduce (evidence outside every changed region). Lead line: "Not introduced by this diff — reported, does not block." List them verbatim in the `finding-shape.md` shape, each keeping its **real severity emoji inline** on the title, grouped by severity then lens precedence. Continue the report's running number. Omit the whole section if no finding is `pre-existing`. These never contribute to a blocking Verdict.

## 4. Verified OK (optional)

A `## ✅ Verified OK` section: bullets of what a lens **actively checked and cleared** — not mere silence. Each bullet names the lens and what it confirmed (e.g. "Risk: no injection, prototype pollution, ReDoS, or secrets"; "Spec: 8 keys exist in en/es/fr, 1:1 migration, no lost defaultMessage"). Omit the section if no lens reports positive verification; never pad it.

## 5. Clean lenses note

One line listing which lenses returned `No findings.` (and `Spec: no spec available — lens skipped` if applicable). Keeps per-lens coverage visible even though findings are grouped by severity.

## 6. Verdict (optional)

A `## Verdict` closing line: a plain-language merge call referencing findings by number (e.g. "Don't merge until #1 and #3 are resolved"). **Derived, not editorial** — it may only point at findings already listed, in their real severities, and may not silence or downgrade any lens. It counts every **blocking** finding — `introduced` and `behavior-activated`, plus Spec: a report whose sole 🔴/🟠 are `pre-existing` has no blocking verdict — say so ("nothing this diff introduced blocks; N pre-existing item(s) noted for follow-up"). Omit if nothing blocks.

## 7. Summary line

Count per lens + worst severity within each, no cross-lens ranking. Append a per-lens `pre-existing` count in parentheses when a lens has any (worst severity still reflects all that lens's findings):

```
Risk 3 (🔴, 1 pre-existing) | Read 4 (🟡) | Reliab 3 (🔴) | Resil 3 (🔴) | Arch 1 (🟠, 1 pre-existing) | Spec 2 (🟠)
```

## All clean

If every lens is clean: emit the human lead, skip the severity headings, state "All 6 lenses clean — no findings.", and still emit the summary line. Never collapse to a bare "all good".
