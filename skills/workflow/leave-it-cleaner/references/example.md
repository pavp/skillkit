# Worked example — a cohesive, behavior-preserving cleanup

A cohesive set of wins (rename, named constant, redundant comment) applied to the touched zone, keeping the exact same behavior.

```ts
// Asked: fix a bug in this function.
function proc(d: number[], x: number[], flag = false): number[] {
  // process data
  for (const i of d) {
    if (i > 0) { x.push(flag ? i * 1.0825 : i); }
  }
  return x;
}
// Left cleaner — SAME behavior (still fills and returns the caller's array):
const TAX_RATE = 0.0825;
function accumulatePositive(values: number[], out: number[], applyTax = false): number[] {
  for (const v of values) {
    if (v > 0) { out.push(applyTax ? v * (1 + TAX_RATE) : v); }
  }
  return out;
}
```

**Why this is a Boy Scout win:** the signature, the accumulator mutation, and the return value are untouched — only the names, the magic number, and the redundant `// process data` comment changed. All within the touched function, all behavior-preserving.

**What would NOT be a win (out of scope):** dropping the `out` parameter or switching to `values.filter(...).map(...)` (returning a new array). That changes behavior and breaks any caller relying on the accumulator — a refactor the task didn't ask for, not a cleanup. Skip it, or propose it separately; never auto-apply it.
