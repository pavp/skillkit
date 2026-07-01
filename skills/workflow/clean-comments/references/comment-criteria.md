# Comment criteria — the detailed judgment

One axis behind every verdict: **noise** (restates the WHAT the code already shows) vs **load-bearing** (carries a WHY irrecoverable from the code alone). Code shows WHAT; a comment earns its place only when it supplies a WHY the code cannot.

## The surprise test (the master decision)

The default is **no comment**. A comment earns its place only if a competent reader would be **surprised** by the code without it.

Operative question: *if I delete this comment, does the next developer get surprised or misled?*
- **No** → it only restated the code → `noise`.
- **Yes** → it explained something the code doesn't reveal → `load-bearing`.

```ts
i += 1;   // increment i                          -> noise (code already says this)
i += 1;   // compensate for zero-indexing in display  -> load-bearing (a WHY)
```

Everything below is this one test applied to specific shapes.

## Load-bearing: the three shapes a WHY takes

Each is irrecoverable from the code alone.

- **Counterintuitive** — a non-obvious choice: `// use < not <= because the index is 0-based`
- **Scar** — a bug/quirk/workaround: `// Safari reports seconds, not ms — hence the *1000`
- **Road-not-taken** — why an alternative was rejected: `// not Promise.all here: it saturates the rate limit`

## The reason-token gate

A comment that *looks* redundant is **not** noise if it names a reason — this turns "am I sure there's no hidden why?" into an inspectable check.

Tokens (any present → `load-bearing`): `because`, `to avoid`, `so that`, `fails`, `bug`, `quirk`, `workaround`, `safe`, `instead`, `hack`, **any proper noun naming an external system / browser / library / service / standard**, a ticket/PR id **cited as the reason for a choice**, or any clause explaining WHY. The proper-noun rule is open by design: if a word *might* be such a name and you are unsure, treat it as a token → `load-bearing`.

Ticket ids cut both ways: `// batched per JIRA-123: the API caps at 100` is `load-bearing` (the id anchors a why); `// Author: jdoe, JIRA-123` is `noise` (bare attribution — see Metadata). The gate fires only when the id is *cited as the reason*.

**Critical lesson (a prior Judgment Day, 2 criticals):** noise-vs-why is a *semantic* call — reading the code — and a wrong "noise" verdict destroys a why permanently. So it is conservative by design: **when uncertain, classify toward `load-bearing`. The delete bar is as high as the add bar.** If the referenced code is unavailable, the restatement and obsolete tests cannot run — never emit `noise` on the comment text alone; degrade to `load-bearing`.

## Noise: the shapes that restate, not explain

All of these are the surprise test failing — the reader loses nothing if the comment goes.

- **Redundant** — restates the code: `user.save(); // save the user`. (Fix by better naming, not by commenting.)
- **Metadata** — bare author/date/history/ticket attribution: `// Author: jdoe, 2021-03, JIRA-123`. Git already has it → `noise`. (A ticket cited as a reason is load-bearing — see the reason-token gate.)
- **Obsolete** — verifiably describes code that no longer exists or works differently AND carried no why to begin with. Stale comments misdirect → `noise`. If unsure whether the code changed, or whether a why remains → `load-bearing` (delete bar = add bar). An obsolete comment that still names a reason is `load-bearing` — the why may still bind the current code.

## commented-out and out-of-domain

- **commented-out** — dead code in comments: `// function oldCalc(x) { return x * 0.15 }`. Git remembers; classify `commented-out`.
- **out-of-domain** — a *standalone* `// TODO`/`// FIXME` work-pending marker is neither noise nor a why; it sits on a task axis this authority does not judge. Return `out-of-domain`; the actor's scaffolding rules handle it. (A `// TODO` sharing a line with code is `trailing`, not `out-of-domain` — trailing is decided first.)

## Blocks and doc comments

A multi-line comment or a doc block (`/* */`, JSDoc/TSDoc) is judged as ONE unit. If any segment carries a why or a reason token, the whole block is `load-bearing`, even if other segments are metadata (`@author`) or restatement. A block comment sharing a line with code is `trailing`. Trailing is "code on the same physical line as the comment opener," in the language's own comment syntax — not specifically `//`.

## Trailing (structural, decided before any semantic test)

`const x = 1; // note` is `trailing` **regardless of content** — a lexical fact (code precedes the comment on the same physical line), not a judgment. It signals the actor "never auto-remove": deleting the line would take the code with it. A trailing comment that also carries a why — or is a `// TODO` — is still `trailing`; the actor decides how to preserve it.

Philosophy: **the best comment is the code itself.** If a comment is needed to explain what code *does*, refactor first, comment last.
