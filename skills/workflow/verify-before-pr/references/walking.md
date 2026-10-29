# Walking a change

## Why the walk, and not only the tests

A suite can pass while the feature is dead: tests written next to the code tend to exercise what was built, not what was asked. The walk is the one check that goes through the real entry point the way a user would. A new test counts as evidence only after it failed on the base commit, because a test that also passes on the old code never touched the change.

## What a probe may touch

| Probe target | Allowed |
|---|---|
| A record this run created | Yes: edit it, duplicate it, delete it |
| A record that already existed | Read only. The mutating variant goes under "Not walked" |
| Bulk or multi-record action | Never |
| An account whose credentials you were not given | Never |

Log every write. That log is "State left behind", required even when everything passes.

On an authorization probe, stop the moment access succeeds and report the boundary that gave way by its shape, never by the data it exposed.

## Edge-case probes

Past the criteria, at most 3 per criterion. Pick the ones the criterion's surface invites. Findings are EXPLORATORY and never change the verdict.

| Surface | Probe |
|---|---|
| Text field | Past the max length. Leading and trailing spaces. Content that looks like markup |
| List | Zero items. Exactly the page size. One over |
| Submit | Twice, fast |
| Filter or search | No results. Change the query while it loads |
| Money or quota | The boundary exactly, then one past it |
| Role gate | The unauthorized role: is the control hidden, and does the API refuse it too |
| Multi-step flow | Refresh midway. Browser back after a successful submit. Fail once, then retry |

## Evidence that holds up

- A screenshot shows the viewport, never the full page, and is redacted before it is saved.
- A command is quoted exactly, with the output it produced at this SHA.
- A FAIL names the step where the walk diverged and what it showed instead.
- A criterion that could not be walked goes under "Not walked" with its reason, never into the table as PASS.

## Rationalizations that signal a broken rule

- "It's a one-line fix" → you are about to write code. Hand it back.
- "Let me check the code to see what it should do" → you are about to verify the implementation against itself.
- "The tests are green, so it works" → that is a claim. Walk it.
- "I'll use the token in `.env`" → invented access. Ask.
- "It's just staging" → every environment is production unless the user says otherwise.
