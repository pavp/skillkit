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

Currently documented in depth: compound components + slots (below, with a full reference). The other patterns appear in the Decision Gates marked _reference coming_ — the gate routes you to the right pattern now; the detailed reference lands in a follow-up.

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
| Consumer must read/override the component's state | Control props (`value` + `onChange`, controlled/uncontrolled) — _reference coming_ |
| Seed internal state from props + expose a reset | State initializer (`initialValues` + `reset`) — _reference coming_ |
| Consumer extends styling per instance | Extensible styles (`className` + `style` passthrough) — _reference coming_ |

## Execution Steps

1. State what varies: shared state across parts, or injected markup.
2. Match it to ONE pattern via the gates; avoid stacking patterns.
3. Compound: create a context in the parent, consume it in each child, expose children as `Parent.Child`.
4. Slots: type injected regions as `ReactNode` props or `children`; keep the public API minimal.

## Examples

Type the CONTEXT value; expose it through a null-checking custom hook (the type guard); attach parts as a namespace (`Tabs.Tab`). When to use it, whether you need context, the type-safety trap to avoid, full TypeScript implementation, and the generic `createTabs<T>()` variant:

→ `references/compound-pattern.md`

## Output Contract

Return:
- The chosen pattern and the one-line reason it fits (what varies).
- The component's public composition API (how parts nest).
- Any simpler pattern rejected and why.

## References

- `react-hooks` skill — for reusable stateful logic.
- `react-component` skill — basic single-component structure (use first).
