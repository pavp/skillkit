# Structure criteria — the detailed judgment

One axis behind every verdict: **is the shape of this body honest and single-sourced?** Knowledge should live in one place, values should be named, intent should be visible in the form, and a body should not reach through objects it doesn't own. The rules are language-agnostic — examples use TypeScript, but duplicated knowledge in Python, a magic literal in Go, or a train wreck in Rust fail the same tests.

Resolution is two-stage (see the SKILL's Hard Rules). **Stage 1** applies each rule's own trigger and drops any rule whose trigger is unmet, whose inputs are unavailable, or that is uncertain — the uncertainty test runs here, before precedence, so a weak high-row rule never races a strong low-row one. **Stage 2** takes the topmost rule that survived stage 1, in the SKILL's Decision Gates order (S1 → S4 → S3 → S2 → S5), which is deliberately NOT the numeric order the rules are explained in below — the rules appear here numerically for readability, but the table is the precedence authority. The order places the more specific verdict higher, so the common collisions resolve cleanly:

- **Repeated type/enum branch set → `S4`, not `S1`.** A branch set repeated in ≥2 sites IS technically duplicated knowledge (S1's trigger), but S4 is the specific case and is placed above S1. S1's trigger explicitly excludes the branch-set case so the two never both fire on it.
- **Magic literal inside a repeated switch → `S4`, not `S2`.** Fix the duplication and the literal moves with it.
- **Magic literal inside an obscured expression → `S3`, not `S2`.** Fix the form (an intention-revealing call) and the literal disappears into it; naming the literal alone leaves the expression obscured.

Every trigger is citable — you can point at the lines. If you can't, the rule drops to `clean`. This judge is easy to over-apply, so the uncertainty bar is high: a structural fix always churns call sites or shifts an abstraction, so the cost to fix is never zero.

## S1 — Duplication (DRY)

Every piece of knowledge should have one authoritative representation. The trigger is objective: **the same knowledge — a rule, a formula, a constant — appears in ≥2 citable places in the supplied scope.**

```ts
// Bad — the tax rule lives in three places; a change touches all three
const caTotal = subtotal * 1.0825;
const nyTotal = subtotal * 1.07;
const txTotal = subtotal * 1.0625;

// Good — one source of truth
const TAX_RATES: Record<string, number> = { CA: 0.0825, NY: 0.07, TX: 0.0625 };
const total = (subtotal: number, state: string) => subtotal * (1 + TAX_RATES[state]);
```

- The second site must be **in the supplied scope**. A lone expression that *might* be duplicated elsewhere is not citable → `clean`.
- Incidental similarity is not duplication. Two blocks that look alike but encode different knowledge (they change for different reasons) are NOT S1 — collapsing them is artificial coupling. The test is *shared knowledge*, not *shared text*.
- **A repeated type/enum branch set is NOT S1 — it is `S4`.** A branch set duplicated across sites is a subset of "duplicated knowledge", but S4 owns that specific shape (it has a specific fix: polymorphic dispatch). S1's trigger excludes it so the two rules never both fire on the same body.

Boundary: S1 flags the repeated knowledge. Whether the extracted unit needs a name is `clean-names`; whether it does one thing is `clean-functions`.

## S2 — Magic value

A bare literal that carries domain meaning should be named. The trigger: **a number or string literal with domain significance appears with no name explaining it.**

```ts
// Bad — what is 86400?
if (elapsedTime > 86400) expire();

// Good — the name carries the meaning
const SECONDS_PER_DAY = 86400;
if (elapsedTime > SECONDS_PER_DAY) expire();
```

- `0`, `1`, `-1`, `""`, and true/false in their obvious idiomatic uses (index, increment, empty check) are NOT magic → `clean`. The trigger is *domain meaning*, not *any literal*.
- The "evident from context" escape covers only structural idioms (`* 2` to double, `[0]` first element). A **domain rate, threshold, or coefficient** — a tax multiplier `1.0825`, a timeout `86400`, a discount `0.15` — is S2 even used once and even when its surrounding expression is simple: the value encodes a business decision the arithmetic does not reveal. `sub * 1.0825` does not tell the reader `1.0825` is a tax rate → S2.
- **S2 is independent of S1.** A literal is magic on its own merits — being duplicated is not required. So when S1 drops in stage 1 (e.g. the second duplication site is out of scope), S2 is still evaluated on that same literal and fires if the literal carries domain meaning. A dropped S1 never suppresses S2.

## S3 — Obscured intent

The form of an expression should reveal what it does. The trigger: **the expression performs an operation its shape hides** — bit-twiddling, a dense chained ternary, a clever one-liner that needs decoding.

```ts
// Bad — correct, but the reader must decode it
return ((x & 0x0f) << 4) | (y & 0x0f);

// Good — the intent is the name
return packNibbles(x, y);
```

The fix direction is an intention-revealing call or an explanatory variable — not a comment (that's `clean-comments`). If the expression is idiomatic and immediately legible to a competent reader of that language, it is NOT obscured → `clean`.

## S4 — Repeated type switch

A single branch over a type discriminant is fine. The trigger is DUPLICATION: **the SAME set of type/enum branches is repeated in ≥2 sites.** That is the smell polymorphism removes — every new type forces edits in every site.

```ts
// Bad — the same three-way branch appears in calculatePay, describeRole, and canApprove
function calculatePay(e: Employee) {
  switch (e.type) { case "SALARIED": ...; case "HOURLY": ...; case "COMMISSIONED": ...; }
}
function describeRole(e: Employee) {
  switch (e.type) { case "SALARIED": ...; case "HOURLY": ...; case "COMMISSIONED": ...; }
}

// Good — behavior lives with the type; adding a type touches one place
interface Employee { calculatePay(): number; describeRole(): string; }
```

- **A lone switch is NOT S4.** One dispatch site over a discriminated union is a legitimate, often idiomatic choice → `clean`. Do not push polymorphism onto a single switch.
- The second site must be in the supplied scope and share the SAME branch set. Two switches over different discriminants are not S4.
- Redesigning one switch into a class hierarchy is an architecture decision (that's a `review-6-lens` architecture concern), not a structural fix → `clean`.

Boundary: what type the discriminant should be is `ts-types`; S4 only flags the repeated branch shape.

## S5 — Train wreck (Law of Demeter)

A body should talk to its immediate collaborators, not reach through them. The trigger: **≥2 intermediate objects sit between the receiver and the value — dot-depth ≥3 past the receiver.** In `a.b.c.d` the receiver is `a`; `b` and `c` are the two intermediates you reach *through* to get `d` → S5. Boundary case: `a.b.c` has ONE intermediate (`b`) → dot-depth 2 → `clean`. The terminal value never counts as a crossed object.

```ts
// Bad — reaching through three objects the caller doesn't own
const dir = context.options.scratchDir.absolutePath;

// Good — ask the immediate collaborator
const dir = context.getScratchDir();
```

- Fluent/builder chains that return the same object (`query.where().orderBy().limit()`) are NOT train wrecks → `clean`. The trigger is *reaching through foreign objects*, not *chained calls*.
- Data-shape navigation on a value you own (a parsed JSON tree, a config object you constructed) is a judgment call — if you own the whole structure, resolve to `clean`.
- **A train-wreck chain repeated in ≥2 citable sites is `S1`, not `S5`** — the same navigation path in two places is duplicated knowledge, and S1 sits above S5 in precedence (topmost-wins). Check duplication first: emit `S5` only for a chain that appears once (or whose second site is out of scope, so S1 drops in stage 1). This mirrors the S1↔S4 carve-out — the more specific/topmost verdict wins.

The fix direction is a method on the immediate collaborator (one dot). Whether that method needs a name is `clean-names`.

## Verdict quick reference

| Verdict | Principle | Fix direction |
|---------|-----------|---------------|
| S1 | DRY | one authoritative source |
| S2 | No magic values | a named constant |
| S3 | No obscured intent | an intention-revealing call or explanatory variable |
| S4 | No repeated type switch | polymorphic dispatch (only when repeated) |
| S5 | Law of Demeter | one dot — a method on the immediate collaborator |
| clean | Single-sourced, named, honest, one dot | — |

## The boundary (what clean-structure does NOT judge)

Shape (S1–S5) is language-agnostic. Names, types, comments, and single-purpose belong to their own authorities.

| Concern | Authority |
|---------|-----------|
| Shape of the body: duplication, magic values, obscured intent, repeated switch, train wreck (S1–S5) | **clean-structure** (any language) |
| Whether a NAME reveals/matches intent | `clean-names` (any language) |
| Whether a function does ONE thing, honest inputs, alive (F2–F5) | `clean-functions` (any language) |
| Whether a comment is noise or load-bearing | `clean-comments` (any language) |
| What type/shape a value should be; arg-count | `ts-types` / `ts-function-signatures` (TypeScript) |
| Redesigning a single switch into a hierarchy (architecture) | `review-6-lens` (architecture lens) |
| Applying the extract, rename-to-constant, or dispatch | `leave-it-cleaner` (the actor) |

Philosophy: **knowledge in one place, values with names, intent in the form, one dot.** If a change to one rule forces edits in two places, that's the extract boundary.
