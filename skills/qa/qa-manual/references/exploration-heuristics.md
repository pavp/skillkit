# Exploration Heuristics

## Evidence standard

A finding is reportable when it was walked and re-walked. The narration is the evidence of having walked it — it names the actual entry point, the actual data, and the actual screen, so it cannot be assembled from reading code.

| Element | Required |
|---|---|
| The walk | Prose, continuous, from entry to outcome, with the divergence marked where it appeared |
| Expected | What the requirement said, cited — or that nothing said anything |
| Observed | What the app did, in the same sentence flow |
| Artifact | Accessibility-tree snapshot preferred; viewport screenshot when pixels matter; never `fullPage` |
| Reproducibility | Walked 3 times: 3/3 → confirmed; 1–2/3 → intermittent, reported with the ratio; 0/3 → not a finding |

Never report a suspicion. If a journey could not be walked (missing access, destructive, unreachable), it belongs in "not walked" — never in findings, never implied as a pass.

## What a probe may touch

Every probe below is subject to the mutate-only-what-this-run-created rule. Before running one, ask which record it writes:

| Probe target | Allowed |
|---|---|
| A record this run created | Yes — delete it, duplicate it, corrupt it freely |
| A record that already existed | Read-only. Report the mutating variant under "not walked" |
| Bulk or multi-record action | Never, whatever the plan says |
| An account whose credentials you were not given | Never |

Log every write: what was created, modified, deleted, or abandoned half-applied. That log is the "State left behind" section, and it is required even on a clean PASS.

On an authorization probe, stop the instant access succeeds. The finding is that the boundary gave way — reported by shape, never by the data it exposed. Reading further, or chaining to a second boundary, turns a found vulnerability into a real exposure caused by the QA run.

## Attack surfaces

Push past the plan here first. These are where undefined behavior surfaces fastest. Capped at 5 probes per journey; surfaces left unprobed go to "not walked".

| Surface | Probe |
|---|---|
| Any text field | Max length, then past it. Paste instead of type. Unicode, emoji, RTL. Leading/trailing space. Content that looks like markup |
| Any list | Zero items. One item. Exactly the page size. One over. Sort, then page — does the sort survive |
| Any submit | Twice, fast. Then once with the network slowed |
| Any delete | On something referenced elsewhere. Then delete again, from a stale tab |
| Any filter or search | No results. Then a query that matches everything. Then change the query mid-load |
| Any upload | Zero bytes. Over the limit. Wrong type with a right extension |
| Any role gate | The unauthorized role: is the control hidden, disabled, or does it error on use — and does the API refuse it too |
| Any multi-step flow | Leave midway, come back. See "Interruption and re-entry" below |
| Any money or quota | The boundary exactly, then one past it |

## Interruption and re-entry

Walk the journey again, broken in the middle:

- Refresh mid-flow
- Browser back after a successful submit
- Two tabs on the same record, both edited
- Abandon at the last step, return later
- Session expiry mid-flow
- Permission revoked between entry and submit
- Fail once, then retry immediately

Each probes whether state lives where the flow assumes it does.

## Performance cues

Observation, not measurement. No benchmarking, no profiling — only what a user would feel.

| Cue | Report as |
|---|---|
| Input lags visibly behind typing | Perceptible degradation |
| Scroll stalls or stutters on a populated list | Perceptible degradation |
| Spinner never resolves within a tolerable wait | Functional failure, not just slowness |
| The same action gets slower each repetition | Growth over repetition — the strongest signal, worth reporting even when each single run is tolerable |
| No pending state during a slow action | Invites double-submit — report the double-submit consequence, not the timing |

With a stated budget, exceeding it is a REQUIREMENT VIOLATION: report the observed figure and how it was observed. Without one, user-visible degradation is a REQUIREMENT GAP — the budget was never defined.

## Regression on touched flows

Limited to journeys this change reaches. Without a prior baseline this is a weaker check than a suite, and the report must say so. Walk the neighbouring journey that shares state, storage, or a route with the change and confirm it still completes.

## Rationalizations that signal a broken rule

- "It's obviously a one-line fix" → you are about to write code. Hand off.
- "Let me check the code to see what it should do" → you are about to verify the implementation against itself.
- "It probably fails for the same reason" → you are about to report an unwalked finding.
- "I'll use my own account / a likely URL" → invented access. Ask.
- "It's just staging" → treat every environment as production unless told otherwise.
