---
name: react-memoization
description: "Trigger: useMemo/useCallback/memo decisions — write, keep, or remove. Verdict by regime (React Compiler) and reason (pure-perf vs semantic identity). Use whenever memoization is in doubt: 'should I memoize this', re-render complaints, an effect refiring because a dep is recreated each render, 'is this useless with the compiler'. Reusing logic across components → react-hooks."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0"
---

## Activation Contract

Use when deciding whether a `useMemo`, `useCallback`, or `memo` should be written, kept, or removed. Not for reusing logic (`react-hooks`) or structuring a component (`react-component`).

## Hard Rules

- Determine the regime FIRST. If it cannot be resolved, apply the Undetectable row and state the assumption in the output; never verdict `remove` on an assumed regime.
- Classify every candidate as **pure-perf** or **semantic identity** before deciding — the category, not the hook, drives the verdict.
- Semantic identity is NEVER delegated to the compiler: it is a correctness contract, not an optimization.
- Pure-perf memoization requires citable cost: profiler evidence, a render-path computation that grows with unbounded input, or a memoized-child chain it feeds. No speculative memoization.
- Decide and explain only; do not refactor beyond the memoization itself.

## Decision Gates

Semantic identity = the reference itself is part of the contract:
- value/callback is a dependency of an effect that must (not) refire on identity,
- a stable reference handed to a system outside React (observer, listener, imperative API),
- `memo` with a custom comparator encoding domain equality.

| Regime | Pure-perf candidate | Semantic-identity candidate |
|--------|--------------------|-----------------------------|
| Compiler ON, component compiled | Skip new; remove existing | Write + one-line WHY comment |
| Compiler ON, component bailed out (`"use no memo"` directive or react-compiler lint violation) | Treat as "No compiler" | Write |
| No compiler | Only with citable cost: write new / keep existing; otherwise skip / remove | Write |
| Undetectable | Write only with citable cost; keep existing | Write |

## Execution Steps

1. Determine regime — compiler active when `babel-plugin-react-compiler` is in the Babel config, `reactCompiler` in `next.config.*`, or the compiler plugin in `vite.config.*`; a regime stated by the user counts as evidence. Unresolvable → Undetectable row.
2. Under compiler ON, before any `remove` verdict confirm the specific component actually compiles (no `"use no memo"`, no compiler lint bailout).
3. Classify the candidate: semantic identity or pure-perf.
4. Apply the gate table; for pure-perf, demand the citable cost before approving.
5. For approved semantic-identity memoization in a compiler-ON project (compiled or bailed out), require the WHY comment so it survives future cleanup.

## Output Contract

Return:
- Regime and its evidence — or the stated fallback assumption when undetectable.
- Per candidate: verdict + category (pure-perf / semantic) + one-line reason. Proposed code verdicts are `write`/`skip`; existing code verdicts are `keep`/`remove`.
- Any pure-perf request rejected for lacking citable cost.

## References

- `react-hooks` skill — reusing stateful logic across components.
