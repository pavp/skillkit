# diagnose-fix methodology — the four-phase engine

Adapted from the systematic-debugging discipline. The skill body is the contract; this is the how.

## The Iron Law

```
NO FIX WITHOUT A REPRODUCED FAILURE AND AN IDENTIFIED ROOT CAUSE
```

If you have not reproduced the failure and named its cause, you cannot edit product code. Random fixes waste time and create new bugs. A patch that masks a symptom is a failure, not a fix.

## Phase 1 — Reproduce

You cannot verify a fix for a bug you cannot trigger.

- Read the error in full — stack trace, log output, line numbers, error codes. The message often names the cause.
- Trigger it reliably: same input, same config, same environment. Make it deterministic.
- If it will not reproduce → gather more data (exact steps, versions, env). Do NOT guess. After 3 rounds with no deterministic trigger (flaky, race, env-only), STOP → Unresolved.
- A production-only failure with an authoritative stack trace + logs MAY substitute for a live repro when local reproduction is infra-blocked — but say so explicitly and treat the trace as the evidence anchor. Absent even that, STOP.

## Phase 2 — Root cause

- **Check recent changes.** `git diff`, recent commits, new deps, config drift. `git bisect` to find the breaking commit on a regression.
- **Instrument boundaries in multi-component systems.** For each component boundary (CI→build→sign, API→service→DB): log what enters, log what exits, verify config/env propagation. Run once to reveal WHERE it breaks, then investigate that component.
- **Trace the data flow** from trigger to failure. Confirm WHAT happens and WHY.

Root-cause techniques:

| Technique | Use when |
|-----------|----------|
| 5 Whys (each anchored to evidence: a log line, trace, diff) | Linear single cause |
| Fishbone (people/process/tools/env) | Several candidate causes |
| git bisect | A regression — find the commit |

## Phase 3 — Hypothesis (scientific method)

Not "try things until it works." A falsifiable loop:

1. State a hypothesis that explains the observed evidence.
2. Predict what you'd see if it's true.
3. Run the smallest experiment that tests the prediction.
4. Observe. Confirmed → Phase 4. Refuted → form a NEW hypothesis.

Never stack a second fix on top of a failed one. A failed experiment kills the hypothesis, not the process. Cap: after 3 hypotheses with none confirmed, STOP → Unresolved and report the evidence — do not guess-fix under pressure.

## Phase 4 — Fix + defend

1. Write a regression test that FAILS on the current bug. This proves you target the real cause. If the project has NO test harness → STOP → Unresolved, or degrade to documented manual verification with the caveat flagged.
2. Apply the minimal fix that removes the root cause.
3. The test now passes. Run the affected suite. If other tests break → refuted hypothesis (Phase 3) or scope creep (escalate) — not done.
4. If the test doesn't go red-before / green-after, the fix is unverified — return to Phase 3 as a new hypothesis attempt if the cap isn't spent; if the 3 hypotheses are already used, STOP → Unresolved.

## Rationalizations that signal a skipped gate

If you catch yourself thinking any of these, STOP — you're about to violate the Iron Law:

- "This one's obvious, I'll skip repro." Simple bugs have root causes too.
- "It's urgent, no time for the process." Guessing guarantees rework; systematic is faster than thrashing.
- "I'll just try this fix and see." That's a hypothesis with no experiment — make it one.
- "The trace is gone, so it's fixed." Symptom hidden ≠ cause removed.
