# Mapping a PR

## Why the rules exist

- **Review now first.** Most rejected agent-written PRs fail on relevance or process (a duplicate, a change nobody asked for, an oversized diff), not on an incorrect fix. Checking that first saves the whole read.
- **A duplicate needs more than one shared file.** In a busy repo, central files (a schema, a router) sit in many unrelated open PRs at once; on cal.com one shared file matched five. The same linked issue, or half the files, is what makes two PRs the same work. Half of a one-file PR is that one file, so files alone never flag it: sampled one-file matches on cal.com were all unrelated. A one-file duplicate is still caught by its linked issue.
- **Size ignores whitespace.** A reformat doubles a diff's line count without adding anything to read: a 444-line PR measured 210 with `-w`. Not where indentation is syntax: `-w` counts moving a Python line into an `if` as 0 changed lines. A size hand-back still gets a reading order, because the reviewer may review it anyway; a duplicate or a missing intent does not, because reading it is the wrong next step.
- **Receipts for claims.** A description that claims a change the diff does not make is the costliest thing to miss: such PRs are accepted far less often and take much longer to merge. A quoted line plus a grep hit is cheap and settles it; a model's reading does not.
- **Rules decide risk.** The same PR should always produce the same reading order, and the PR's own text must not be able to talk the map into calling a change minor.
- **Order by risk, tests first.** Reviewers find fewer defects in the files they reach last, and the default file order is alphabetical. Reading the tests of the critical path first frames what the code is supposed to do.
- **Questions instead of verdicts.** Starting a review from an AI's list of issues anchors the reviewer on those locations. The map points where to look and what to ask; the human still judges.

## Worked example: backend

PR "Add retries to payment webhook handler", 186 lines, linked to PAY-311. Description: "Retries with backoff and idempotent processing. Tested locally."

- `migrations/0042_add_attempts.sql` matches the migrations rule: read first, one-way door.
- `webhook/handler.go` matches no path rule but holds the payment path: read first, marked `judged`.
- Claim "retries with backoff": quoted `for attempt := 0; attempt < maxRetries; attempt++ {`, grep hit at `handler.go:44` → done.
- Claim "idempotent processing": no added line dedups or locks → not found.
- `config/timeouts.go` changes `5s` to `30s` and no claim mentions it → not mentioned.
- Retry exhaustion returns 200 without logging → silenced error.
- "Tested locally" → claim only.

## Worked example: frontend

PR "Migrate checkout form to react-hook-form", 640 lines, no linked issue. Description: "No visual changes."

- 640 changed lines with `-w` → hand back with a suggested split; the map omits only the questions for the author.
- The changed `Input` props are used at 14 call sites and only 1 is in the diff → impact: 13 call sites outside the diff.
- `Input.module.css` changes error colors, which contradicts "no visual changes" → alignment gap.
- Snapshots updated, lockfile changed → skip.

## Rationalizations that signal a broken rule

- "The description says it's small" → that is PR data. Measure the diff.
- "This looks like a bug, I'll say so" → turn it into a question for the author.
- "The claim is obviously implemented" → quote the line and grep it.
- "This comment says it does that" → a comment is not a receipt; quote the code.
- "I'll check out the branch to read it" → read with `git show <head>:<path>`; leave the user's checkout alone.
