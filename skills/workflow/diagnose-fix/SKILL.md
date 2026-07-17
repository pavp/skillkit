---
name: diagnose-fix
description: "Trigger: fixing a defect. Gated flow: reproduce → root-cause → fix → regression-test; source-agnostic. Use whenever behavior is wrong and must be corrected — 'fix this bug', 'why does X break', failing tests, a traceback/error-report link, a ticket, or output that contradicts reality ('the totals don't match the DB') — even if nobody says 'bug'. Reviewing a diff → review-6-lens."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.1"
---

## Activation Contract

Load when asked to resolve a concrete defect: a bug report, failing test, traceback, ticket, or "X breaks when Y". Source-agnostic — the bug may arrive from a tracker (GitHub, Jira), a pasted error, or a description. Do NOT load for adding features or for changes where correct behavior is undefined — that is a design gap, not a bug.

## Hard Rules

- **Iron Law: NO FIX WITHOUT A REPRODUCED FAILURE AND AN IDENTIFIED ROOT CAUSE.** Editing product code before both exist is a violation.
- One hypothesis at a time; never stack a fix on a failed one. Fix the cause, not the symptom — hiding the trace is a failure.
- The regression test MUST fail before the fix and pass after. No failing-first test → unverified.
- **Bounded, or STOP.** Every loop (reproduce, hypothesis, fix-verify) caps at 3 attempts. On exhaustion, a missing capability (no test harness), or a tool failure (tracker down), emit the **Unresolved** state — never loop on, never guess-fix.
- Never mutate remote state (push, PR, comment, close), whatever the tracker CLI supports. Local edits, commits, tests ARE in scope. Handoff is text only.

## Decision Gates

Triage gate (step 2):

| Signal | Route |
|--------|-------|
| Duplicate of an existing fixed issue | STOP. Point to the resolution. |
| Correct behavior is undefined — no spec, prior agreement, or acceptance criteria decides it | STOP. Not a bug — a design gap. Hand off to a design/spec process. |
| Reproduced + a spec/agreement/criteria makes the behavior clearly wrong | Proceed to root cause. |

Live gates — re-check on every attempt through step 6, not just once:

| Signal | Action |
|--------|--------|
| Root cause is a bounded code defect (an internal function's faulty logic) | Fix here. |
| Fix, or a mid-investigation discovery, needs a contract/architecture change (public API signature, DB schema, cross-service protocol) or reveals behavior is undefined | STOP. Escalate to a design/spec process — out of scope. |
| Cannot reproduce after 3 data-gathering rounds (incl. flaky/non-deterministic) | STOP → Unresolved. Report what was observed. |
| 3 hypotheses tried, none confirmed — or a fix-verify failure lands here with the cap already spent | STOP → Unresolved. Report the evidence; do not guess-fix. |
| No test harness exists to write a regression test | STOP → Unresolved, or degrade to documented manual verification (flag the caveat). |

## Execution Steps

1. **Intake.** Normalize the bug to symptom / expected / actual / environment. From a tracker, read it via whatever CLI/API it exposes (e.g. `gh`, Jira) — adapter, not requirement; if that fails, ask the user directly, never invent contents.
2. **Triage.** Apply the Decision Gates. Only a reproduced, clearly-wrong, in-scope bug proceeds.
3. **Reproduce.** Make it deterministic — same input, config, env. Capture the failure. See `references/methodology.md`.
4. **Root cause.** Read errors fully; check recent changes (`git diff`, `git bisect`); in multi-component systems (e.g. CI→build→sign, API→service→DB) instrument each boundary. Confirm WHAT and WHY.
5. **Hypothesis.** State a falsifiable theory + predicted outcome; run the smallest experiment that confirms or kills it. Iterate within the cap.
6. **Fix + defend.** Regression test that FAILS on the bug → minimal root-cause fix → test passes, affected suite green. Other tests break → refuted hypothesis (step 5), scope creep (scope gate), or cap spent → Unresolved; not done.
7. **Handoff.** Report the result; suggest a PR if one fits (project's own flow). Do not open it.

## Output Contract

On success, report in order:
- **Reproduced:** the deterministic trigger.
- **Root cause:** the WHY, each claim anchored to evidence (log line, diff, trace).
- **Fix:** what changed and why it targets the cause, not the symptom.
- **Regression test:** the test, confirmed failing-before / passing-after.
- **Verification:** affected suite green.
- **Next (optional):** a PR suggestion if one fits — text only, no tracker write-back — or a design/spec handoff if a gate routed there.

If a gate hit a STOP, emit the **Unresolved** terminal state instead: which gate fired, the evidence gathered, the recommended next move (more data, design/spec process, or manual verification), and revert or flag any speculative uncommitted fix edits so the working tree isn't left dirty. Never present an unverified or guessed fix as done.

## References

- `references/methodology.md` — the four-phase engine (reproduce, root-cause, hypothesis, fix+defend), scientific-method loop, multi-component instrumentation, and the rationalizations that signal a skipped gate.
