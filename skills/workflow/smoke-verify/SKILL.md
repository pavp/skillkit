---
name: smoke-verify
description: "Trigger: smoke test, quick verify, does it still work, check nothing broke, fast health check of an app, feature, or function. Runs the cheapest verification ladder and returns PASS/FAIL/INCONCLUSIVE; reports, never repairs."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Load this skill on an explicit smoke request ("smoke test", "quick verify", "does it still work", "check nothing broke") or when a fast health verdict is needed: a feature is completed, a refactor finished, a dependency was upgraded, build configuration changed, before opening a PR, after fixing a production issue, or an orchestrator needs a health verdict before its next step. Scope is the whole project or a named target (feature, module, function, endpoint).

Do NOT load for deep coverage, full e2e suites, root-cause debugging (this skill only emits a hypothesis), or fixing anything.

Prefer running in a fresh, isolated context when the runtime offers one — smoke output is noisy and pollutes the caller's context. Degrade to inline execution otherwise.

## Hard Rules

- Report and STOP at the first FAIL. Never repair, never retry-to-green, never adjust the project so a step passes.
- Use only tooling already present in the project; never install anything, globally or locally.
- Never write report files; the report is the return message only.
- Derive commands from the project itself (manifests, scripts, CI config, docs) — adapt to the stack, never assume one.
- If no verification rung can be determined, the verdict is INCONCLUSIVE — never FAIL. INCONCLUSIVE means "could not determine how to verify"; FAIL means "verified and broken".
- Keep the whole run inside a short time budget: minutes, not tens of minutes. See references → "Time Budget".
- `escalation` is a recommendation field only — the caller decides; never invoke re-verification yourself.

## Decision Gates

| Condition | Action |
|---|---|
| Named target given | Trim the ladder to rungs that touch the target only. |
| Whole-project scope | Climb the full ladder. |
| Rung not applicable to the stack | Mark `skipped` with reason, continue. |
| Rung would blow the time budget | Mark `skipped` with reason, continue to a cheaper signal — do not wait it out. |
| First FAIL | Stop; mark all remaining rungs `skipped`. |
| Web UI target and browser automation already installed | Drive the minimal key flow with it; never install it. |
| No rung determinable | Return INCONCLUSIVE with what was tried. |
| FAIL on a high-stakes scope (auth, payments, security, data integrity) or the hypothesis is uncertain | Set `escalation` in the report: recommend independent adversarial re-verification when the runtime offers it. |

## Execution Steps

1. Resolve scope: whole project, or a named target and the rungs relevant to it.
2. Discover how the project verifies itself: manifests, scripts, CI config, README. Select applicable rungs.
3. Climb the ladder cheapest-first: (1) compiles/validates, (2) fast existing tests, (3) boots, (4) functional probe of the key flow. See references → "The Ladder".
4. Time every rung. On failure, capture the minimal output fragment that proves the break and write a one-sentence cause hypothesis.
5. Stop at the first FAIL; mark the rest `skipped`.
6. Return the dual-layer report — human summary first, then the machine block. See Output Contract.

## Output Contract

Return exactly two layers in one message, no files:

1. **Human summary** — 3–5 lines, verdict first: what was verified, what broke, the hypothesis in one sentence.
2. **Machine block** — one fenced `yaml` block: `verdict` (PASS/FAIL/INCONCLUSIVE), `scope`, `steps[]` with `name`, `status` (pass/fail/skipped), `duration`, for failures `output_fragment` + `hypothesis`, and optional `escalation` when the escalation gate fires. Full schema and example in references → "Report Contract".

## References

- [references/report-contract.md](references/report-contract.md) — YAML report schema, full example, fragment/hypothesis rules.
- [references/ladder.md](references/ladder.md) — rung detail, discovery sources, target trimming, browser-automation gate, time budget, INCONCLUSIVE vs FAIL.
