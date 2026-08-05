# Journey Derivation

## Narrative case shape

A case is one continuous walk, written as prose, from where the user enters to where they end up. The expected outcome lives inside the narration.

> Signed in as a viewer-role user, I open the shared document list, pick the first document, and use the row menu to delete it. The delete option is not offered; if it is, choosing it leaves the document in place and explains that viewers cannot delete.

Why prose and not numbered steps: a step list reads correctly out of order, so a broken intermediate state goes unnoticed. A continuous walk makes the break visible — the sentence stops making sense. Prose also cannot be filled in from reading code; a narration written without walking the flow reads hollow, which is what keeps "observed, or it did not happen" enforceable downstream.

Each case carries: its authority label, the access it needs (URL, token, account, role, seeded data), and the outcome inside the prose.

## Blast-radius ranking

Order journeys by what a failure costs, not by how easy the journey is to walk.

| Rank | Cost |
|---|---|
| 1 | Irreversible data loss or corruption |
| 2 | Money, billing, quota |
| 3 | Auth, permissions, cross-tenant exposure |
| 4 | Data written wrong but recoverable |
| 5 | Blocked workflow, no data harm |
| 6 | Cosmetic, degraded but usable |

A run stopped early should have bought the most information — that is the whole reason for the ordering.

## Boundary checklist

Per input, derive the variant walks that matter:

| Input kind | Boundaries |
|---|---|
| Text | empty, whitespace only, one char, max length, over max, unicode/emoji, RTL, leading/trailing space, HTML or script-looking content |
| Number | zero, negative, one, max, over max, non-integer, non-numeric, leading zeros |
| Collection | none, exactly one, exactly the page size, one over the page size, large enough to page, duplicates |
| Date/time | past, now, future, DST transition, timezone offset, invalid, range inverted (end before start) |
| File | zero bytes, at limit, over limit, wrong type, correct extension with wrong content, name with spaces or unicode |
| Selection | nothing selected, all selected, an option that disappeared between load and submit |
| Identity | owner, collaborator, viewer, unauthenticated, another tenant's member, a revoked session |

## State-transition matrix

The bugs live between steps, not in them. For each multi-step journey, walk it again diverted:

| Divergence | What it probes |
|---|---|
| Abandon midway, return later | Partial state persisted or orphaned |
| Refresh mid-journey | State held in memory only |
| Browser back after submitting | Replay, double-write, stale form |
| Submit twice fast | Idempotency, duplicate records |
| Two tabs, same record | Concurrent edit, last-write-wins, lost update |
| Fail then retry | Retry on dirty state, partial rollback |
| Permission revoked mid-journey | Authorization checked at entry only |
| Session expires mid-journey | Silent data loss on resume |
| Slow network on submit | Double-submit, no pending state, premature success |

## Where requirements go silent

The highest-value gaps cluster here. For each, ask what the requirement says the outcome is — silence is the finding.

- **Error paths.** Happy path is specified; what the user sees when the write fails rarely is.
- **Permission boundaries.** Who can do it is stated; what the unauthorized user sees (hidden, disabled, or an error) is not.
- **Empty states.** What a list shows with zero items, and whether that differs from still loading.
- **Concurrency.** Two actors on one record.
- **Limits.** Max length, page size, rate — a number exists in the schema but not in the requirement.
- **Partial success.** A bulk action where some items succeed.
- **Reversibility.** Whether the action can be undone, and for how long.
- **Performance budget.** How slow is too slow.
- **Persistence.** Whether a draft survives a refresh.
