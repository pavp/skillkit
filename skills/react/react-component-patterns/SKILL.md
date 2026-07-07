---
name: react-component-patterns
description: "Trigger: designing the public API of a REUSABLE React component, UI or headless. Use this whenever parts share state (<Tabs> with <Tab>, or a context provider with no markup), a parent controls the value (value+onChange, controlled/uncontrolled), a caller injects markup via slots, or state seeds from props with a reset — even if no pattern is named. Building one plain component → react-component."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Use when designing the API of a REUSABLE React component — how its parts compose, how its state is controlled, how it's initialized, how it's styled from outside. This is the umbrella for component-design patterns: compound components, slots, control props (controlled/uncontrolled), state initializer, extensible styles.

Boundaries: for building/refactoring a single basic component use `react-component`; for reusable stateful LOGIC (custom hooks) use `react-hooks`.

Each pattern has a full reference under `references/` (see Pattern references): compound components + slots, control props, state initializer, extensible styles.

## Hard Rules

These apply across every pattern in this family; each pattern's own rules and anti-patterns live in its reference.

- Pick exactly ONE pattern per problem (match via Decision Gates); never stack patterns to cover the same need.
- Reach for the simplest pattern that fits — props/slots before context, uncontrolled before controlled, a seed before lifting state. Add machinery only when a concrete need forces it.
- Read the chosen pattern's reference before implementing — each documents a real anti-pattern that the naive version walks into.
- Type the component's public contract explicitly (context value, control props, render-prop args, style props); don't lean on inference for the API consumers depend on.

## Decision Gates

| Need | Pattern |
|------|---------|
| Parts grouped but NOT sharing state | Namespaced composition via props — no context |
| Parts share state, arbitrarily nested | Compound components + typed context |
| Parts share state, 1–2 fixed levels | Compound via direct props, no context |
| A list driven by DATA | `props` + `.map()` — NOT compound |
| Caller injects arbitrary markup into fixed regions | Slots via `children` / `ReactNode` props |
| Two fixed regions (header + body) | Named slots: `ReactNode` props |
| Avoid prop drilling for shared state across parts | Compound (context), not lifting every prop |
| Consumer must read/override the component's state | Control props (`value` + `onChange`, controlled/uncontrolled) → `references/control-props.md` |
| Seed internal state from props + expose a reset | State initializer (`initialValue` + `reset`) → `references/state-initializer.md` |
| Consumer extends styling per instance | Extensible styles (`className` + `style` passthrough) → `references/extensible-styles.md` |

## Execution Steps

1. State what varies: shared state across parts, who owns the live state (component or consumer), the initial/reset seed, injected markup, or per-instance styling.
2. Match it to ONE pattern via the Decision Gates.
3. Open that pattern's reference (see Pattern references) and follow its implementation and TypeScript contract — including the anti-pattern it warns against.
4. Type the public API explicitly; keep it minimal — expose only what the consumer needs.

## Pattern references

Each pattern's full TypeScript implementation, gotchas, and anti-pattern live in its reference:

- **Compound components + slots** — parts sharing state via guarded context; markup injection via slots: → `references/compound-pattern.md`
- **Control props** — controlled/uncontrolled via `value`/`defaultValue`/`onChange`: → `references/control-props.md`
- **State initializer** — seed state + stable `reset()`: → `references/state-initializer.md`
- **Extensible styles** — `className`/`style` passthrough and merge: → `references/extensible-styles.md`

## Output Contract

Return:
- The chosen pattern and the one-line reason it fits (what varies).
- The component's public composition API (how parts nest).
- Any simpler pattern rejected and why.

## References

- `react-hooks` skill — for reusable stateful logic.
- `react-component` skill — basic single-component structure (use first).
