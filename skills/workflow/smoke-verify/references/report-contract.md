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
steps:
  - name: <rung name, e.g. "typecheck">
    status: pass | fail | skipped
    duration: <e.g. 12s; omit for skipped>
    reason: <required when skipped: why>
    output_fragment: |     # required when fail
      <minimal excerpt proving the break>
    hypothesis: <one sentence, required when fail>
inconclusive_reason: <required when verdict is INCONCLUSIVE: what was tried and why no rung was determinable>
escalation:             # optional; only when the escalation gate fires
  recommended: true
  reason: <one sentence: why independent re-verification is worth it>
```

## Field rules

- `verdict` derivation: any `fail` step → FAIL; no rung determinable → INCONCLUSIVE; otherwise PASS. Skipped rungs do not block PASS.
- `output_fragment`: the smallest excerpt that proves the break — the failing assertion, stack-trace head, or error line. Never full logs. Quote errors exactly.
- `hypothesis`: one sentence, best guess at cause, uncertainty marked plainly ("likely", "possibly"). It is a lead for whoever fixes, never a diagnosis.
- `reason` on skipped: `not applicable to stack`, `over time budget`, `stopped after first FAIL`, or similarly concrete.
- Durations are wall-clock in coarse units (`12s`, `1m40s`).
- `escalation`: set only on FAIL in a high-stakes scope (auth, payments, security, data integrity) or when the hypothesis is uncertain. It is a recommendation for the caller — this skill never invokes re-verification itself. Runtimes without an adversarial-review capability may ignore it.

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
