# Output Contract

How the orchestrator assembles the final report after the 6 lenses return. Findings are grouped by **severity**, not lens; each finding still carries its originating lens. Emit these parts in order.

## 1. Human lead

1–2 sentences: what was reviewed (fixed point + file count) and the single worst thing found, in plain language.

## 2. Findings by severity

One `##` heading per severity **present**, highest first: `🔴 BLOCKERS` → `🟠 CRITICAL` → `🟡 WARNING` → `🔵 SUGGESTION`. Omit a severity with no findings. Number findings continuously across the whole report — the first is `1.` whatever its severity; numbering never resets per heading. Each finding is the lens's own text in the `finding-shape.md` shape, ordered within a severity by lens precedence (Risk → Readability → Reliability → Resilience → Architecture → Spec). The verbatim / no-dedupe / no-rerank rules live in `finding-shape.md`.

## 3. Verified OK (optional)

A `## ✅ Verified OK` section: bullets of what a lens **actively checked and cleared** — not mere silence. Each bullet names the lens and what it confirmed (e.g. "Risk: no injection, prototype pollution, ReDoS, or secrets"; "Spec: 8 keys exist in en/es/fr, 1:1 migration, no lost defaultMessage"). Omit the section if no lens reports positive verification; never pad it.

## 4. Clean lenses note

One line listing which lenses returned `No findings.` (and `Spec: no spec available — lens skipped` if applicable). Keeps per-lens coverage visible even though findings are grouped by severity.

## 5. Verdict (optional)

A `## Verdict` closing line: a plain-language merge call referencing findings by number (e.g. "Don't merge until #1 and #3 are resolved"). **Derived, not editorial** — it may only point at findings already listed, in their real severities, and may not silence or downgrade any lens. Omit if nothing blocks.

## 6. Summary line

Count per lens + worst severity within each, no cross-lens ranking:

```
Risk 3 (🔴) | Read 4 (🟡) | Reliab 3 (🔴) | Resil 3 (🔴) | Arch 1 (🟠) | Spec 2 (🟠)
```

## All clean

If every lens is clean: emit the human lead, skip the severity headings, state "All 6 lenses clean — no findings.", and still emit the summary line. Never collapse to a bare "all good".
