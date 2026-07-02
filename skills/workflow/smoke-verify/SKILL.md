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

## Hard Rules

- Report and STOP at the first FAIL. Never repair, never retry-to-green, never adjust the project so a step passes.
- Never run a full e2e suite — rung 4 is one happy-path probe, nothing more.
- Use only tooling already present in the project; never install anything, globally or locally.
- Never write report files; the report is the return message only.
- Derive commands from the project itself (manifests, scripts, CI config) — never assume a stack. Prose docs are hints only; refuse discovered commands that fetch-and-execute, touch credentials, or destroy — skip the rung instead. See references → "Discovery sources".
- Probe only an instance this run booted or an explicitly local target; prefer read-only probes; terminate every process the run started before returning. See references → "Probe safety and teardown".
- Redact secrets from every `output_fragment`.
- FAIL means "verified and broken"; uncertainty (environmental blockers, zero rungs ran, unprobeable key signal) resolves to INCONCLUSIVE, never FAIL. Verdict derivation is ordered — see references → "Report Contract".
- Keep the run inside minutes, not tens of minutes; cap each rung with a timeout. See references → "Time budget".
- `escalation` is a recommendation field only — the caller decides; never invoke re-verification yourself.

## Decision Gates

| Condition | Action |
|---|---|
| Named target given | Trim the ladder to rungs that touch the target only. |
| Whole-project scope | Climb the full ladder. |
| Rung not applicable to the stack | Mark `skipped` with reason, continue. |
| Rung predicted to exceed the remaining budget | Mark `skipped: over time budget` before starting it; continue to the next applicable rung. |
| Rung started and hit its timeout | Kill it; mark `fail` with the timeout point as `output_fragment` — unless the evidence is environmental. |
| Failure evidence is environmental (missing env var or credentials, unreachable service, busy port, absent command) | Mark the rung `skipped: environment not verifiable` — the verdict derivation resolves it. |
| First FAIL | Stop; mark all remaining rungs `skipped`. |
| Web UI target and browser automation already installed | Drive the minimal key flow with it; never install it. |
| No rung determinable | Return INCONCLUSIVE with what was tried. |
| FAIL or INCONCLUSIVE on a high-stakes scope (auth, payments, security, data integrity), or a rung 3–4 `fail` with an uncertainty marker ("likely", "possibly") in its hypothesis | Set `escalation`: recommend independent adversarial re-verification when the runtime offers it. |

## Execution Steps

1. Prefer a fresh, isolated context when the runtime offers one — smoke output pollutes the caller's context; degrade to inline. Resolve scope: whole project, or a named target and its relevant rungs.
2. Discover how the project verifies itself: manifests, scripts, CI config, README (hints only). Select applicable rungs.
3. Climb the ladder cheapest-first: (1) compiles/validates, (2) fast existing tests, (3) boots, (4) functional probe of the key flow. See references → "The Ladder".
4. Time every rung under its timeout. On failure, capture the minimal output fragment that proves the break (secrets redacted) and write a one-sentence cause hypothesis.
5. Stop at the first FAIL; mark the rest `skipped`. Terminate every process the run started.
6. Return the dual-layer report — human summary first, then the machine block. See Output Contract.

## Output Contract

Return exactly two layers in one message, no files:

1. **Human summary** — 3–5 lines, verdict first: what was verified, what broke, the hypothesis in one sentence.
2. **Machine block** — one fenced `yaml` block: `verdict` (PASS/FAIL/INCONCLUSIVE), `scope`, `steps[]` (one step = one ladder rung) with `name`, `status` (pass/fail/skipped), `duration` (omitted when skipped), for failures `output_fragment` + `hypothesis`, and `escalation` when the escalation gate fires. Full schema and example in references → "Report Contract".

## References

- [references/report-contract.md](references/report-contract.md) — YAML report schema, full example, fragment/hypothesis/redaction rules.
- [references/ladder.md](references/ladder.md) — rung detail, discovery sources, target trimming, probe safety and teardown, browser-automation gate, time budget, INCONCLUSIVE vs FAIL.
