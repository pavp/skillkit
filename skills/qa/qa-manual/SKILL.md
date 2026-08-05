---
name: qa-manual
description: "Trigger: manually testing a running app. Walks real journeys, verifies against the requirement, hunts what nobody specified, reports slowness — never fixes. Use whenever a feature needs a hands-on pass: 'run the manual tests for this', 'does this actually work', 'try to break it', 'is this ready for review', 'the client says X fails'. Fixing what it finds → diagnose-fix."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Load to exercise a running application by hand: verifying something just implemented, checking a branch before opening a PR, probing a pre-existing feature, or confirming a reported bug. Manual/exploratory QA, not automated suites.

Do NOT load to author test code, review a diff (→ `review-6-lens`), or fix a defect (→ `diagnose-fix`).

## Hard Rules

- **Read-only on the product. Never write code** — no fix, patch, test file, or config edit, not even an obvious one-liner. Fixing what you find destroys the independence that makes the verdict worth anything. Hand off to `diagnose-fix`.
- **Never read the implementation.** Journeys come from the requirement; observe only what the running app does. Reading code verifies what was built instead of what was asked, turning the omission you exist to catch invisible. Outranks convenience.
- **Run where the implementation was never seen, or declare the bias.** Not reading code is not enough — a context that already holds the implementation is biased whether or not a file is opened. Prefer an isolated execution context (describe the capability, never name a runtime's agent type). When the current context already saw the code, say so in the report and treat the verdict as degraded, exactly like a degraded requirement source.
- **A plan comes first.** Use a `qa-test-plan` output, or invoke it. Never derive journeys here.
- **Load `browser-automation-safety` before the first browser call**; obey it for the rest of the run.
- **Every finding carries its authority** (see gate). Unlabeled is a violation — mixing opinion into citable failures is how real bugs get discarded alongside them.
- **Observed, or it did not happen.** Narrate each finding as the journey actually walked. No inference from code or plausibility.
- **Ask, never invent, for access.** A journey needing a URL, token, credential, account, permission, or seeded state STOPS and asks — never guess an endpoint, fabricate a credential, or substitute an account you happen to have.
- **Never mutate what cannot be lost.** Treat every environment as production unless told otherwise: no destructive action on real data, no bulk operations, no writes to shared accounts. Report such a journey as unwalked, and why.

## Decision Gates

Capability (step 1) — whether this can run at all:

| Available | Action |
|---|---|
| Browser MCP, or project-installed Playwright/Puppeteer/Selenium | Proceed; prefer accessibility-tree snapshots. |
| App down, project declares a start script (`dev`, `start`) | Run it. Report what it did — it may migrate or seed. |
| Only a CLI/API surface | Proceed; state UI behavior went unverified. |
| Cannot reach the app, or a credential/URL/permission is missing | **STOP → BLOCKED.** Name what is missing and ask. Never a verdict. |

Finding authority — exactly one per finding:

| Basis | Label |
|---|---|
| Requirement states the outcome; behavior differs | REQUIREMENT VIOLATION (cite it) |
| Requirement silent on a condition reached in practice | REQUIREMENT GAP (name what is undefined) |
| Beyond the requirement; a real user would be harmed | EXPLORATORY (name the risk) |

Performance is observed, never benchmarked: a stated budget exceeded is a VIOLATION (report the figure); user-visible degradation with no budget is a GAP; tolerable slowness goes unreported.

## Execution Steps

1. **Detect capability**, starting the app via a declared script if needed. Apply the gate; on BLOCKED go straight to the Output Contract.
2. **Get the plan** — use or invoke `qa-test-plan`. Ask for missing access before walking, not midway.
3. **Walk the baseline first.** If the intended journey fails, stop broad exploration and report — on a broken baseline every downstream finding is noise.
4. **Walk in order,** highest blast radius first, narrating each journey as taken and capturing evidence (snapshot preferred; never `fullPage`).
5. **Push past the plan** — interrupt mid-journey, re-enter, refresh, double-submit, navigate back, retry after failure, exhaust permissions, feed boundary and wrong-type input. Note perceptible slowness and growth over repetition.
6. **Check regression on touched flows only,** stating that without a prior baseline this is weaker than a suite.
7. **Reproduce before reporting.** Non-reproducible → intermittent with the attempt count, never confirmed.
8. **Report and stop.** Route defects to `diagnose-fix`.

## Output Contract

An index for triage, narration for reproduction:

- **Capability + requirement authority + context isolation** — what drove the app, what a start script did, what went unverified, and whether this ran in a context that had already seen the implementation. Degraded or absent authority means no finding can be called a failure; say so here.
- **Verdict** — PASS / FAIL / PASS WITH GAPS (requirement journeys held, undefined behavior found) / BLOCKED. When the ask was to confirm a reported bug: CONFIRMED or NOT REPRODUCED — the latter means it did not happen with these steps, not that it does not exist.
- **Findings index** — one scannable line each, grouped by authority, violations first.
- **Findings, narrated** — one block each, reusing the plan's journey language with the divergence marked where it appeared: walked, expected, seen. Plus evidence and reproducibility.
- **Requirement gaps** — what the requirement never decided, each with the decision it needs. Lead here when no requirement exists.
- **Walked / not walked** — outcomes, plus skips and why (destructive, missing access, unreachable). Never let a skip read as a pass.
- **Handoff** — defects worth routing to `diagnose-fix`. Text only; open nothing, fix nothing.

On BLOCKED, return only what was missing, what would resolve it, and the plan left unwalked.

## References

- `references/exploration-heuristics.md` — attack surfaces by input type, interruption and re-entry patterns, permission probing, performance observation cues, and evidence standards.
