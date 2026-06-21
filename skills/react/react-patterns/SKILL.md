---
name: react-patterns
description: "Trigger: compound components, slots, component composition, reusable component API, prop drilling. Compose React components with markup-sharing patterns."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Use when designing how React component PARTS compose and share markup/state — compound components and slots. For reusable stateful LOGIC use `react-hooks`. For basic single-component structure use `react-component`.

## Hard Rules

- Reach for the SIMPLEST composition that fits; do not add flexibility you do not yet need.
- Compound components are for LAYOUT (Tabs, Card, Toolbar), not data. A data list is `props` + `.map()`, not compound.
- Use context for compound state ONLY when children are arbitrarily nested. For 1–2 fixed levels, pass state via direct props or `cloneElement` — context adds re-renders and boilerplate you may not need.
- When you do use context, never type `children` to police what is allowed (`ReactElement<XProps>[]`) — TS checks this unreliably and it breaks on `.map()`, conditionals, and fragments. Put type safety in the context value instead; a stray child is harmless.
- Expose context through a custom hook that null-checks and throws; children read state through it, never via `useContext` directly.
- Prefer `children`/slots over configuration props when the caller only needs to inject markup.

## Decision Gates

| Need | Pattern |
|------|---------|
| Layout parts, arbitrarily nested, sharing state | Compound components + typed context |
| Layout parts, 1–2 fixed levels | Compound via direct props / `cloneElement` (no context) |
| A list driven by DATA | `props` + `.map()` — NOT compound |
| Caller injects arbitrary markup into fixed regions | Slots via `children` / `ReactNode` props |
| Two fixed regions (header + body) | Named slots: `ReactNode` props |
| Avoid prop drilling for shared state across parts | Compound (context), not lifting every prop |

## Execution Steps

1. State what varies: shared state across parts, or injected markup.
2. Match it to ONE pattern via the gates; avoid stacking patterns.
3. Compound: create a context in the parent, consume it in each child, expose children as `Parent.Child`.
4. Slots: type injected regions as `ReactNode` props or `children`; keep the public API minimal.

## Compound — the type-safe shape

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
