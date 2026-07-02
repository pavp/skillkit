# Smoke Verify — Report Contract

## Shape

One returned message, two layers, in this order. Never write it to a file.

### Layer 1 — Human summary

3–5 plain lines, verdict first. Say what scope was verified, which rungs ran, what broke, and the hypothesis in one sentence. No tables, no YAML.

### Layer 2 — Machine block

One fenced `yaml` block. Nothing after it.

## Schema

```yaml
verdict: PASS | FAIL | INCONCLUSIVE
scope: <"project" or the named target>
duration_total: <e.g. 2m14s>
steps:                   # one step = one ladder rung
  - name: <rung name, e.g. "typecheck">
    status: pass | fail | skipped
    duration: <e.g. 12s; present for every executed rung, omitted when skipped>
    reason: <required when skipped: why>
    output_fragment: |   # required when fail; optional on an environmental skip
      <minimal excerpt proving the break, secrets redacted>
    hypothesis: <one sentence, required when fail>
inconclusive_reason: <required when verdict is INCONCLUSIVE: what was tried and what blocked verification>
escalation:              # optional; only when the escalation gate (SKILL.md Decision Gates) fires
  recommended: true
  reason: <one sentence: why independent re-verification is worth it>
```

## Field rules

- `verdict` derivation is total, applied in order: (1) any `fail` step → FAIL; (2) zero rungs ran (all skipped, or none determinable) → INCONCLUSIVE; (3) a skip (`environment not verifiable` or `no side-effect-free probe`) blocked the scope's key signal → INCONCLUSIVE; (4) otherwise → PASS.
- `output_fragment`: the smallest excerpt that proves the break — the failing assertion, stack-trace head, or error line. Never full logs. Quote the error text exactly, but redact embedded secrets: credentials, tokens, API keys, connection-string passwords (`postgres://user:***@host`).
- `hypothesis`: one sentence, best guess at cause, uncertainty marked plainly ("likely", "possibly"). It is a lead for whoever fixes, never a diagnosis.
- `reason` on skipped: `not applicable to stack`, `over time budget`, `environment not verifiable`, `no side-effect-free probe`, `stopped after first FAIL`, or similarly concrete.
- `duration`: wall-clock in coarse units (`12s`, `1m40s`); present for every executed rung, omitted when skipped.
- `escalation`: set only when the escalation gate in SKILL.md Decision Gates fires. A recommendation for the caller; runtimes without an adversarial-review capability may ignore it.

## Example

```yaml
verdict: FAIL
scope: login flow
duration_total: 58s
steps:
  - name: typecheck
    status: pass
    duration: 9s
  - name: auth unit tests
    status: fail
    duration: 31s
    output_fragment: |
      FAIL src/auth/session.test.ts
        expected 401, got 200 for expired token
    hypothesis: token expiry comparison likely regressed in the refactor.
  - name: server boots
    status: skipped
    reason: stopped after first FAIL
  - name: login probe
    status: skipped
    reason: stopped after first FAIL
escalation:
  recommended: true
  reason: auth failure with an unconfirmed hypothesis; independent re-verification advised.
```

Human layer for the same run:

> Smoke FAIL on the login flow in 58s. Typecheck passed; auth unit tests broke — expired tokens now return 200 instead of 401. Likely the token expiry comparison regressed in the refactor. Server boot and login probe skipped after the failure. Auth is high-stakes: independent re-verification recommended.
