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

Tokens: `because`, `to avoid`, `so that`, `fails`, `bug`, `quirk`, `workaround`, `safe`, `instead`, `hack`, **any proper noun naming an external system / browser / library / service / standard**, a ticket/PR id **cited as the reason for a choice**, or any clause explaining WHY.

How the gate fires depends on the declared provenance:

- **`established`** — any token present → `load-bearing`. The proper-noun rule is open by design: if a word *might* be such a name and you are unsure, treat it as a token.
- **`fresh`** — a token counts ONLY when it names a why the code cannot show. A token sitting inside a plain restatement does not rescue it. The restatement test (below) has already run by this point, so a comment reaching the gate in `fresh` mode and still reading as a restatement is `noise`.

```ts
// safe to mutate here                 -> fresh: noise | established: load-bearing
// safe to mutate: the caller cloned   -> both: load-bearing (names why it is safe)
// use map instead of forEach          -> fresh: noise | established: load-bearing
// map, not forEach: forEach swallows the return -> both: load-bearing
```

The first and third rows are the two-speed design at its sharpest: identical text, opposite verdicts by regime. That is deliberate — on `established` the token buys the benefit of the doubt, on `fresh` there is no doubt to benefit. Do not generalize the `fresh` column to `established`; the undeclared default is `established`, so it is the common case.

Ticket ids cut both ways: `// batched per JIRA-123: the API caps at 100` is `load-bearing` (the id anchors a why); `// Author: jdoe, JIRA-123` is `noise` (bare attribution — see Metadata). The gate fires only when the id is *cited as the reason*.

**Critical lesson (a prior Judgment Day, 2 criticals):** noise-vs-why is a *semantic* call — reading the code — and a wrong "noise" verdict destroys a why permanently. That is why `established` resolves genuine doubt toward `load-bearing`: **there, the delete bar is as high as the add bar.** The lesson bounds *doubt*, not restatement — a comment that verifiably restates present code was never carrying a why to lose, at any age. If the referenced code is unavailable, no test ran at all: degrade to `load-bearing` in both regimes, never emit `noise` on comment text alone.

## Provenance: why two speeds

The conservative default protects an *irrecoverable* why — a scar nobody remembers, where the comment is the last record of a bug someone hit. That risk is real for `established` code and absent for `fresh`: nothing irrecoverable can be lost in code no human has reasoned about yet, because no reasoning happened. An agent that wrote both the code and the comment a minute ago documented nothing a reader could not re-derive.

So the axis moves one thing only: **who wins a tie.** Restatement, metadata, and verifiable obsolescence fall in both regimes — age never launders a restatement into a why. `fresh` is not a licence to guess aggressively; it is a licence to stop preserving comments *just in case* when the "case" cannot exist yet.

Undeclared provenance → `established`. A caller that forgets to declare gets the safe bar, never the aggressive one. The judge never derives provenance and never inspects git — the declaration is the only channel, and it is per comment. A caller must not declare a whole file or hunk `fresh`: that hands pre-existing comments to the strict bar, which is the one way this axis loses a why it should have kept.

An actor caller like `leave-it-cleaner` knows which comments it wrote this session, so it declares per comment as a matter of course. A human asking directly usually declares nothing, and that is the asymmetry to watch: the sceptical ask — *"does this really deserve a comment?"* — sounds like a request for the strict bar and is not a declaration of one. Reading it as `fresh` would apply the aggressive tie-break to comments that have survived review, which is exactly the population where a forgotten scar is irrecoverable. So the ask runs `established` and the verdict names that bar as an assumption; the human who meant `fresh` says so and asks again. Nothing is lost by that default: scepticism is answered by the restatement test, not by the bar — which is why the body puts that answer in the Hard Rule rather than here.

The `fresh` tie-break is bounded by the gates that run before it. A comment naming an external system, a threshold learned from a failing run, an observed failure, or a rejected alternative exits at the load-bearing shapes (step 6) or the token gate (step 7) — it never reaches the tie-break. What reaches step 8 in `fresh` mode is a comment that survived the restatement test, names no why the code cannot show, and carries no qualifying token. Those are the ties the aggressive bar breaks toward deletion.

## Noise: the shapes that restate, not explain

All of these are the surprise test failing — the reader loses nothing if the comment goes.

- **Redundant** — restates the code: `user.save(); // save the user`. (Fix by better naming, not by commenting.)
- **Metadata** — attribution and NOTHING else: `// Author: jdoe, 2021-03, JIRA-123`. Git already has it → `noise`. Any reason clause anywhere in the comment disqualifies this gate, whatever else it carries: `// Author: jdoe — disabled because Safari 14 crashes` is `load-bearing`, not metadata. The test is "attribution only", not "starts with attribution".
- **Obsolete** — verifiably describes code that no longer exists or works differently AND carried no why to begin with. Stale comments misdirect → `noise`. If unsure whether the code changed, or whether a why remains → `load-bearing` (delete bar = add bar). An obsolete comment that still names a reason is `load-bearing` — the why may still bind the current code.

## commented-out and out-of-domain

- **commented-out** — dead code in comments: `// function oldCalc(x) { return x * 0.15 }`. Git remembers; classify `commented-out`.
- **out-of-domain** — a *standalone* `// TODO`/`// FIXME` work-pending marker is neither noise nor a why; it sits on a task axis this authority does not judge. Return `out-of-domain`; the actor's scaffolding rules handle it. A `// TODO` sharing a line with code is still `out-of-domain`; sharing the line only constrains the remedy to the comment span.

## Blocks and doc comments

A multi-line comment or a doc block (`/* */`, JSDoc/TSDoc) is judged as ONE unit. If any segment carries a why — a reason token under the declared regime's rule — the whole block is `load-bearing`, even if other segments are metadata (`@author`) or restatement. A block comment sharing a line with code is judged on content like any other; the shared line sets its remedy (see Trailing).

## Trailing (a removal constraint, not a verdict)

`const x = 1; // note` shares a physical line with code. That is a lexical fact about **how to remove it**, not a reason to keep it.

Earlier versions of this authority returned `trailing` as a terminal verdict ahead of every semantic test, which made line position a shield: `const x = 1; // the counter` survived as `trailing` even though it is pure restatement. Agent-generated code produces that shape in volume, so the shield leaked more noise than any other rule here.

The judge now classifies content first and reports the structural fact as the remedy:

| Comment | Verdict | Remedy |
|---------|---------|--------|
| `const x = 1; // the counter` | `noise` | `delete-comment-span` — drop `// the counter`, keep `const x = 1;` |
| `retry(3); // the API 429s past 3` | `load-bearing` | `keep` |
| `flush(); // TODO batch these` | `out-of-domain` | caller's scaffolding rules |

The original concern stands and is now handled precisely: **never delete the whole line.** "Trailing" is reported as a qualifier alongside the content verdict, never in place of it.

**Span extent.** `delete-comment-span` removes from the comment opener through its terminator — for a block comment opened on a code line and closed lines later, that includes the closer and every line between, plus any line left whitespace-only. Code before the opener and after the terminator is preserved verbatim.

**Real openers only.** Trailing is "code on the same physical line as the comment opener," in the language's own comment syntax — not specifically `//`. A marker inside a string, template, regex, or char literal is not an opener: `"https://x"`, `split("//")`, `/a\/\/b/` have no trailing comment. Same care where a marker doubles as an operator (`--` in SQL vs decrement, `#`, `;`, `%`). Cannot establish the opener lexically → prescribe `keep` and say the span is undeterminable; never guess at a destructive edit.

Philosophy: **the best comment is the code itself.** If a comment is needed to explain what code *does*, refactor first, comment last.
