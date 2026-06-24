# Control Props (controlled / uncontrolled) in TypeScript

Reference for the **control props** pattern. Read this when a component owns
some state internally but a parent needs to read or drive that state — the same
decision behind every `<input>`.

## The problem

A self-contained component owns its state (`useState`) and works alone. But the
moment a parent needs to **coordinate** that state — sync it across siblings,
persist it, validate it — the parent has no handle on it. Control props give the
parent that handle without forcing every component to be fully lifted.

A component is **uncontrolled** when it owns its state, **controlled** when the
parent owns it via `value` + `onChange`. Support both from one component: the
parent opts into control by passing `value`; otherwise the component manages
itself.

## The modern pattern

Make `value` and `onChange` optional. Derive "controlled" from whether `value`
is passed — **per render**, not captured once.

```tsx
type UseCounterArgs = {
  value?: number;                 // present => controlled
  defaultValue?: number;          // initial state when uncontrolled
  onChange?: (next: number) => void;
};

const useCounter = ({ value, defaultValue = 0, onChange }: UseCounterArgs) => {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;        // recomputed every render
  const count = isControlled ? value : internal;   // single source of truth

  const setCount = (next: number) => {
    if (!isControlled) setInternal(next);           // own state only when uncontrolled
    onChange?.(next);                               // always notify
  };

  return { count, setCount };
};
```

Consumer, controlled:

```tsx
<Counter value={cart[id] ?? 0} onChange={(n) => setCart({ ...cart, [id]: n })} />
```

Consumer, uncontrolled (same component):

```tsx
<Counter defaultValue={3} onChange={(n) => console.log(n)} />
```

## Why this shape

- **`isControlled` is recomputed each render**, not stored in a `useRef` at
  mount. A ref snapshot can't see a parent that starts passing `value` later;
  recomputing always reflects the current props.
- **`count` reads from props when controlled, state when not** — there is one
  source of truth per mode, never two competing copies.
- **`onChange` always fires**; `setInternal` runs only when uncontrolled. The
  controlled component never mutates local state — the parent's `value` flowing
  back in is what re-renders it.

## Anti-pattern: syncing props into state with `useEffect`

Do NOT mirror the prop into state and reconcile with an effect:

```tsx
// ❌ derived-state-from-props: extra render, stale flashes, double updates
const [count, setCount] = useState(value);
useEffect(() => setCount(value), [value]);   // the smell
```

This is the classic "derived state from props" bug. It renders once with the
stale value, then again after the effect; it fights the parent for ownership.
Read controlled values **directly from props during render** (above) instead of
copying them into state.

## TypeScript notes

- `value?` and `onChange?` are **optional** — that optionality is exactly what
  lets one component be both controlled and uncontrolled.
- Type `onChange` with the payload the parent needs. A bare `(next: number)` is
  enough for one value; pass an args object (`{ id, next }`) when the parent
  must know *which* instance changed.
- Name the uncontrolled seed `defaultValue` (mirrors the DOM's
  `value`/`defaultValue` convention) so the controlled/uncontrolled split reads
  the way React developers already expect.

> Mental model: this is exactly how `<input value=… onChange=…>` (controlled)
> vs `<input defaultValue=…>` (uncontrolled) works. Copy that contract.
