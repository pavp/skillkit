# Decision Gates — detail & companion contract

The per-row rules behind the Decision Gates table in `SKILL.md`, and the companion-skill degradation contract. Gate IDs (`G1`–`G8`) match the table and the gate receipt. The table stays terse; the full conditions live here.

## Per-row detail

- **`G1` Poor variable/function name** — Classify via `clean-names`; rename only a flagged verdict (`N1`–`N7`), never a `clean` one. Auto ONLY if the flagged symbol is non-exported and referenced solely within the touched zone; an exported/public symbol is proposed, never auto-renamed (callers may live in files you never opened).
- **`G2` Comment** — Classify via `clean-comments`, declaring provenance per comment: `fresh` for a comment you authored in this session, `established` for one that was already there. Never declare a whole file or hunk `fresh` — that hands pre-existing comments to the strict bar. Act on the returned remedy: `delete` removes the comment; `delete-comment-span` removes ONLY the comment text and keeps the code and formatting on that line; `keep` and `defer` are never deleted. Auto if the remedy is a deletion and the comment sits in the touched zone.
- **`G3` Function doing two things / mutated arg / flag param / dead helper** — Classify via `clean-functions`; act only on a flagged verdict (`F2`–`F5`), never `clean` or `defer-signature`. Always Propose — a split, a mutation-to-return, or a deletion touches call sites, so it is never auto-applied even when the symbol looks zone-local.
- **`G4` Duplicated logic / magic value / obscured intent / repeated type switch / train wreck** — Classify via `clean-structure`; act only on a flagged verdict (`S1`–`S5`), never `clean`. Auto ONLY for `S2` (name a bare literal — behavior-preserving, no call sites move). `S1` (extract a single source), `S4` (polymorphic dispatch), and `S5` (add a method on the collaborator) touch call sites → Propose. `S3` (intention-revealing extraction) → Propose. This gate replaces the old inline "Magic number → Auto" rule, which double-owned `clean-structure`'s S2 axis.
- **`G5` Dead local var** — Remove only if unused in the whole file. Auto.
- **`G6` Unused import** — Remove ONLY a plain named/default import, unused in the whole file, that is not a side-effect import (`import 'x'`) or a re-export; else skip. Auto.
- **`G7` Deeply nested block** — Extract one small, well-named function ONLY if it needs no new params and adds no side effects; else skip. Propose.
- **`G8` TypeScript: types, signatures, module/imports** — Follow the matching `ts-*` skill; do not invent rules. Per that skill.

## Companion skills

Each is referenced by name and installed separately. If one is absent, never guess: degrade or skip per its rule below.

- **`clean-comments`** — classifies a comment (noise / load-bearing / commented-out / out-of-domain) and prescribes a remedy (`delete` / `delete-comment-span` / `keep` / `defer`); you declare each comment's provenance (`fresh` / `established`). Delete only on a deletion remedy, and only the span it names. Absent → delete only an own-line comment that plainly restates code; leave every comment that shares a line with code alone.
- **`clean-names`** — classifies an identifier against naming rules (`N1`–`N7` or `clean`); rename only a flagged verdict, and only when the symbol is non-exported and referenced only within the touched zone. Absent → rename only an obviously cryptic zone-local, never a public/exported symbol.
- **`clean-functions`** — classifies a function (`F2` output arg / `F3` flag / `F4` dead / `F5` single-responsibility, or `clean` / `defer-signature`); propose a split, mutation-to-return, or deletion only on a flagged `F2`–`F5`, always Propose (it touches call sites). Absent → skip the split; keep the current inline behavior and leave the function alone.
- **`clean-structure`** — classifies a code body's shape (`S1` duplication / `S2` magic value / `S3` obscured intent / `S4` repeated type switch / `S5` train wreck, or `clean`); act only on a flagged `S1`–`S5`. Auto only for `S2` (name a literal); `S1`/`S3`/`S4`/`S5` Propose (they move call sites or shift an abstraction). Absent → name a plainly domain-significant literal to a zone-local `const`, but skip duplication/dispatch/train-wreck rewrites (they need the judge's scope call).
- **`ts-types`, `ts-function-signatures`, `ts-module-organization`** — TS style authority for types, signatures, modules. Defer when installed; absent → skip that cleanup.
