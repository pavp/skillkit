---
name: react-component-patterns
description: "Trigger: compound components, slots, control props, controlled/uncontrolled, state initializer, extensible styles, reusable component API. Design patterns for reusable React components (not building a basic one → react-component)."
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

- Compound components are for LAYOUT (Tabs, Card, Toolbar), not data. A data list is `props` + `.map()`, not compound.
- Use context ONLY when parts SHARE state AND are arbitrarily nested; never by default (see Decision Gates for the share-state / nesting / fixed-level branches).
- When you do use context, never type `children` to police what is allowed (`ReactElement<XProps>[]`) — TS checks this unreliably and it breaks on `.map()`, conditionals, and fragments. Put type safety in the context value instead; a stray child is harmless.
- Expose context through a custom hook that null-checks and throws; children read state through it, never via `useContext` directly.
- Prefer `children`/slots over configuration props when the caller only needs to inject markup.

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

1. State what varies: shared state across parts, who owns that state (the component or the consumer), or injected markup.
2. Match it to ONE pattern via the gates; avoid stacking patterns.
3. Compound: create a context in the parent, consume it in each child, expose children as `Parent.Child`.
4. Slots: type injected regions as `ReactNode` props or `children`; keep the public API minimal.

## Pattern references

Each documented pattern has a full reference with TypeScript and gotchas:

- **Compound components + slots** — context value typing, null-checking guard hook, namespace (`Tabs.Tab`), the type-safety trap, the `memo`/`forwardRef` namespace gotcha, the generic `createTabs<T>()` variant: → `references/compound-pattern.md`
- **Control props (controlled/uncontrolled)** — the `value`/`defaultValue`/`onChange` contract, recomputing `isControlled` per render, the derive-state-from-props anti-pattern: → `references/control-props.md`
- **State initializer** — seeding state from `initialValue`, snapshotting the seed with `useRef` so `reset()` doesn't drift, exposing controls via a typed render prop: → `references/state-initializer.md`
- **Extensible styles** — accepting `className` + `style`, merging (not replacing) with `clsx`, the unguarded-concat `"undefined"` bug, `CSSProperties` and `ComponentPropsWithoutRef` typing: → `references/extensible-styles.md`

## Output Contract

Return:
- The chosen pattern and the one-line reason it fits (what varies).
- The component's public composition API (how parts nest).
- Any simpler pattern rejected and why.

## References

- `react-hooks` skill — for reusable stateful logic.
- `react-component` skill — basic single-component structure (use first).
