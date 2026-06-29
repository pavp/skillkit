# Comment shape

Every drafted comment follows three beats, in order. The question closes; it does not dilute.

```
<observation — symptom + the mechanism (what breaks AND why), one line>
<proposed next action — teammate voice, not an order>
<question — hands the judgment to the author>
```

## Why this shape

- **Observation first, with the why.** State the symptom and the technical mechanism behind it — "X throws because Y is unguarded", not just "X is wrong". The mechanism is what makes the comment teach instead of dictate. No recap, no praise warm-up.
- **Proposed action** gives the author something concrete to act on, framed as a suggestion.
- **Closing question** opens the decision instead of dictating it, and reads human.

The action and the question are not redundant: the action says what you'd do, the question asks whether the author's context agrees. Drop the action and it's vague; drop the question and it's an order.

## Worked examples

### Logic / correctness

```
If `user` arrives null here, the `.profile` access throws at runtime.
I'd add a guard before the access, or validate it in the caller.
Does the caller already guarantee it's never null, or should we cover it here?
```

### Naming / readability

```
`data2` made me stop and trace where it came from.
`parsedRows` would say what it holds at the call site.
Does that name match what's actually in it, or is there a better fit?
```

### Structure / scope

```
This mixes the validation logic with the UI wiring in one change.
Splitting validation into its own commit would keep the review focused and rollback clean.
Is there a reason they need to land together, or can we separate them?
```

## Anti-patterns (do not produce)

- "Great work overall! Just a small thought..." — praise warm-up, AI tell.
- "Maybe we could perhaps consider possibly refactoring this?" — hedging stack.
- "This is wrong. Fix it." — no concept, no question, not collaborative.
- One comment per trivial preference — pile-on. Consolidate to the point that matters.
- Em-dashes inside the comment text — use commas, periods, or parentheses.

## Consolidation rule

Multiple findings on the same locus → one comment carrying the highest-value point. Multiple trivial nits across the diff → fold into a single short note or drop. The author's attention is the scarce resource; spend it on what matters.
