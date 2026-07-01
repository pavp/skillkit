# Comment shape

## Mandatory content, free form

A drafted comment or reply is judged by what it carries, not by a skeleton:

- **The mechanism**, whenever the comment makes a claim: what breaks and why, or why you disagree. "X throws because Y is unguarded", not "X is wrong". The mechanism is what makes a comment teach instead of dictate.
- **A concrete next step**, when there is one to propose — teammate voice, not an order.
- **A closing question**, only on the question trigger below.

Form is free. Length, order, and phrasing follow the point's weight: a self-evident fix is one line; a disputed design point may take four. The classic arrangement (observation → proposal → question) is one natural shape for a finding with an open decision — a default, never a mold. If re-reading your drafts shows the same skeleton in each, you templated; vary them the way one human writing several messages would.

## The question trigger

Close with a question ONLY when you can name the decision that belongs to the other person:

- a tradeoff they own ("stricter typing here costs the plugin API its flexibility, worth it?")
- context you lack ("does the caller already guarantee non-null?")
- an alternative you cannot verify fits ("does `parsedRows` match what's actually in it?")

If you cannot name the decision, end after the observation or the proposal. A question appended to an objective fix ("Typo: `recieve` → `receive`. Thoughts?") is theater and reads more robotic than no question at all.

## Reply cases

Input: the reviewer's comment plus the actual state of what was done about it. Pick the case:

| Case | Reply carries |
|------|---------------|
| Resolved | Brief acknowledgment of the point, then the change (commit, lines). One or two lines. No re-litigating, no over-thanking. |
| Agreed, pending | What you will do and where. |
| Disagree | The mechanism of why, matching the reviewer's kind of evidence (benchmarks against benchmarks, spec quotes against spec quotes). Question only if the call is genuinely theirs. |
| They asked a question | The answer, directly. |
| Mixed / partial | Split by point; apply each point's case within the one reply. Still unclassifiable → ask the user. |

Fix-state handling (mechanics of the Reply truthfulness Hard Rule): claimed but unreferenced → look the change up (log, diff) or ask; real but uncommitted → reference the working-tree change (`file:line`), never a placeholder hash; unknown → ask before drafting; a supplied anchor that disagrees with the working tree → anchor to the verified real line and note the correction.

## Worked examples

The point of these four is the range, with and without a question, not any one shape.

### Resolved reply

```
Good catch, `user` can arrive null there since the session refactor.
Fixed in abc123 with a guard at the top of the handler.
```

### Objective one-liner (authored)

```
`recieve` → `receive` (also in the test name below).
```

### Disagree reply

```
Moving the compile into the loop re-runs the regex per row, and this endpoint sees 10k-row payloads.
That's why it's hoisted. If the readability cost bothers us, naming the compiled pattern might get both.
```

### Finding with an open decision (authored)

```
If `user` arrives null here, the `.profile` access throws at runtime.
I'd add a guard before the access, or validate it in the caller.
Does the caller already guarantee it's never null, or should we cover it here?
```

## Anti-patterns (do not produce)

- "Great work overall! Just a small thought..." — praise warm-up, AI tell.
- "Maybe we could perhaps consider possibly refactoring this?" — hedging stack.
- "This is wrong. Fix it." — no mechanism, not collaborative.
- The same skeleton in every draft — template monotony is an AI tell even when each comment reads fine alone.
- A question appended by reflex — see the question trigger.
- Over-thanking in replies ("Thank you so much for this excellent catch!") — acknowledge once, plainly.
- One comment per trivial preference — pile-on. Consolidate to the point that matters.
- Em-dashes inside the comment text — use commas, periods, or parentheses.

## Consolidation rule

Multiple findings on the same locus → one comment carrying the highest-value point. Multiple trivial nits across the diff → fold into a single short note or drop, even when they sit on different anchors — the fold overrides per-anchor placement, and its gate asks about inclusion, not just confirmation. The author's attention is the scarce resource; spend it on what matters.

```
### src/parse.ts (nits)

Minor, take or leave: `cells` is never reassigned, could be `const` (L9); `c` in the map reads easier as `cell` (L11).

---

Want these in, or skip them?
```

## Render contract (output phases)

The output has two phases. They render the same comment sections; only the trailing matter differs.

**Presentation** (shown to the user for review):

```
### src/auth/session.ts:42

<comment text>

### "shouldn't this be memoized?" (reply)

<reply text>

---

Confirm, adjust, or skip?
```

The `---` rule before the gate prompt is mandatory. The gate addresses the user, not the codebase; without the separator a reader (human or agent) can misread it as part of the last comment and post it. Keep it on its own line, after the rule, never attached to a comment.

Heading selection: a real navigable anchor renders as `file:line`; when the section is a reply, as `file:line (reply)`. A reply thread with no anchor uses the first line of the reviewer's comment (truncated to one line) as its heading, marked `(reply)`. An authored comment with no anchor uses its text locus (symbol, section, or quoted snippet). A folded nits note uses the file (or the diff) as its heading, marked `(nits)`. These are the only heading forms: no invented descriptors or separators appended to the anchor.

**Hand-off** (after the user confirms — what actually gets posted):

```
### src/auth/session.ts:42

<comment text>

### "shouldn't this be memoized?" (reply)

<reply text>
```

No gate prompt, no `---`, no lead-in or sign-off. Each section is paste-ready at its anchor or thread. Whoever posts (user, runtime, another tool) takes these verbatim.
