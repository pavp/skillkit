---
name: react-hooks
description: "Trigger: custom hook, useX, render prop, children as function, reuse stateful logic, share logic between components. Reuse React logic correctly."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Use when reusing stateful LOGIC across components — custom hooks and (rarely) render props. For composing markup/parts use `react-patterns`. For basic structure use `react-component`.

## Hard Rules

- Custom hooks own stateful LOGIC; they MUST NOT return JSX. Name them `useX`.
- Call hooks only at the top level — never in conditions, loops, or callbacks.
- A custom hook MUST be the first choice for logic reuse; render props are a fallback.
- A render prop / children-as-function is justified ONLY when the parent must pass runtime VALUES to caller-supplied markup that a hook cannot return cleanly.
- Keep a hook focused on one concern; return a stable, minimal API (values + actions), not internals.
- Annotate the hook's params and return type explicitly — do not rely on inference for the public signature.

## Decision Gates

| Need | Choice |
|------|--------|
| Reuse logic, caller renders their own UI | Custom hook (`useX`) |
| Parent computes values, caller decides markup with them | Render prop / children-as-function |
| Logic + fixed markup together | Component (not a hook) |
| Effect that must clean up | Hook returning/owning the effect + cleanup |

## Execution Steps

1. Confirm what is being reused: logic (→ hook) or values-into-markup (→ render prop).
2. Default to a custom hook; reach for a render prop only if the gate above demands it.
3. Define the hook's return shape first: `{ value, action }` — stable across renders.
4. Co-locate the hook with its consumers or in a `hooks/` module; export the `useX` name.

## Examples

```tsx
import { useCallback, useState } from "react";

type UseToggle = { on: boolean; toggle: () => void };

// Type params and return explicitly — the hook's public contract.
export const useToggle = (initial: boolean = false): UseToggle => {
  const [on, setOn] = useState<boolean>(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return { on, toggle };           // logic only — no JSX
};
```

## Output Contract

Return:
- Whether a custom hook or render prop was chosen, and the one-line reason.
- The hook's public return shape (values + actions).
- Any render prop rejected in favor of a hook, and why.

## References

- `ts-function-signatures` skill — for the hook's param shape (positional vs options object, defaults).
- `react-patterns` skill — for composing component markup/parts.
- React docs — Rules of Hooks (author-time reference).
