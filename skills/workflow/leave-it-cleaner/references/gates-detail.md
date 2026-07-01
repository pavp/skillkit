# Decision Gates — detail & companion contract

The per-row rules behind the Decision Gates table in `SKILL.md`, and the companion-skill degradation contract. The table stays terse; the full conditions live here.

## Per-row detail

- **Poor variable/function name** — Classify via `clean-names`; rename only a flagged verdict (`N1`–`N7`), never a `clean` one. Auto ONLY if the flagged symbol is non-exported and referenced solely within the touched zone; an exported/public symbol is proposed, never auto-renamed (callers may live in files you never opened).
- **Comment** — Classify via `clean-comments`; delete only a `noise` verdict, never `load-bearing` / `trailing` / `commented-out` / `out-of-domain`. Auto if `noise`.
- **Function doing two things / mutated arg / flag param / dead helper** — Classify via `clean-functions`; act only on a flagged verdict (`F2`–`F5`), never `clean` or `defer-signature`. Always Propose — a split, a mutation-to-return, or a deletion touches call sites, so it is never auto-applied even when the symbol looks zone-local.
- **Duplicated logic / magic value / obscured intent / repeated type switch / train wreck** — Classify via `clean-structure`; act only on a flagged verdict (`S1`–`S5`), never `clean`. Auto ONLY for `S2` (name a bare literal — behavior-preserving, no call sites move). `S1` (extract a single source), `S4` (polymorphic dispatch), and `S5` (add a method on the collaborator) touch call sites → Propose. `S3` (intention-revealing extraction) → Propose. This gate replaces the old inline "Magic number → Auto" rule, which double-owned `clean-structure`'s S2 axis.
- **Dead local var** — Remove only if unused in the whole file. Auto.
- **Unused import** — Remove ONLY a plain named/default import, unused in the whole file, that is not a side-effect import (`import 'x'`) or a re-export; else skip. Auto.
- **Deeply nested block / function doing two things** — Extract one small, well-named function ONLY if it needs no new params and adds no side effects; else skip. Propose.
- **TypeScript: types, signatures, module/imports** — Follow the matching `ts-*` skill; do not invent rules. Per that skill.
- **No safe win** — Do nothing; ship the task alone.

## Companion skills

Each is referenced by name and installed separately. If one is absent, never guess: degrade or skip per its rule below.

- **`clean-comments`** — classifies a comment (noise / load-bearing / commented-out / trailing / out-of-domain); delete only a `noise` verdict. Absent → delete only a comment that plainly restates code, never a trailing one.
- **`clean-names`** — classifies an identifier against naming rules (`N1`–`N7` or `clean`); rename only a flagged verdict, and only when the symbol is non-exported and referenced only within the touched zone. Absent → rename only an obviously cryptic zone-local, never a public/exported symbol.
- **`clean-functions`** — classifies a function (`F2` output arg / `F3` flag / `F4` dead / `F5` single-responsibility, or `clean` / `defer-signature`); propose a split, mutation-to-return, or deletion only on a flagged `F2`–`F5`, always Propose (it touches call sites). Absent → skip the split; keep the current inline behavior and leave the function alone.
- **`clean-structure`** — classifies a code body's shape (`S1` duplication / `S2` magic value / `S3` obscured intent / `S4` repeated type switch / `S5` train wreck, or `clean`); act only on a flagged `S1`–`S5`. Auto only for `S2` (name a literal); `S1`/`S3`/`S4`/`S5` Propose (they move call sites or shift an abstraction). Absent → name a plainly domain-significant literal to a zone-local `const`, but skip duplication/dispatch/train-wreck rewrites (they need the judge's scope call).
- **`ts-types`, `ts-function-signatures`, `ts-module-organization`** — TS style authority for types, signatures, modules. Defer when installed; absent → skip that cleanup.
