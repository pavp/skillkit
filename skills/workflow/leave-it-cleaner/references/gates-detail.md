# Decision Gates — detail & companion contract

The per-row rules behind the Decision Gates table in `SKILL.md`, and the companion-skill degradation contract. The table stays terse; the full conditions live here.

## Per-row detail

- **Poor variable/function name** — Classify via `clean-names`; rename only a flagged verdict (`N1`–`N7`), never a `clean` one. Auto ONLY if the flagged symbol is non-exported and referenced solely within the touched zone; an exported/public symbol is proposed, never auto-renamed (callers may live in files you never opened).
- **Comment** — Classify via `clean-comments`; delete only a `noise` verdict, never `load-bearing` / `trailing` / `commented-out` / `out-of-domain`. Auto if `noise`.
- **Function doing two things / mutated arg / flag param / dead helper** — Classify via `clean-functions`; act only on a flagged verdict (`F2`–`F5`), never `clean` or `defer-signature`. Always Propose — a split, a mutation-to-return, or a deletion touches call sites, so it is never auto-applied even when the symbol looks zone-local.
- **Magic number** — Extract to a named `const`. Auto.
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
- **`ts-types`, `ts-function-signatures`, `ts-module-organization`** — TS style authority for types, signatures, modules. Defer when installed; absent → skip that cleanup.
