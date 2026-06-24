# State Initializer in TypeScript

Reference for the **state initializer** pattern. Read this when a component owns
internal state but the consumer wants to (a) seed its starting value and (b)
reset it back to that seed on demand.

## The problem

A component manages its own state, but the consumer needs two things the
component doesn't expose: a way to set the *initial* value declaratively, and a
`reset()` that returns to that initial value — not to zero, not to the latest
prop, to **the value it started with**. The trap is making reset read the
current prop, so it drifts when the prop changes.

## The pattern

Take an `initialValue` prop, seed `useState` with it, and **snapshot the seed
once** so reset is stable regardless of later prop changes.

```tsx
type UseCounterArgs = {
  initialValue?: number;
  maxCount?: number;
};

const useCounter = ({ initialValue = 0, maxCount = Infinity }: UseCounterArgs) => {
  const [count, setCount] = useState(initialValue);
  // Freeze the seed at mount. reset() returns HERE, even if initialValue changes later.
  const seed = useRef(initialValue);

  const increaseBy = (n: number) =>
    setCount((c) => Math.min(Math.max(c + n, 0), maxCount));

  const reset = () => setCount(seed.current);
  const isMax = count >= maxCount;

  return { count, increaseBy, reset, isMax };
};
```

Expose the controls to the consumer — a render prop (children-as-function) is
the idiomatic way when the consumer arranges its own markup around the state:

```tsx
<Counter initialValue={6} maxCount={10}>
  {({ count, increaseBy, reset, isMax }) => (
    <>
      <span>{count}</span>
      <button onClick={() => increaseBy(-1)}>−</button>
      <button onClick={() => increaseBy(+1)} disabled={isMax}>+</button>
      <button onClick={reset}>Reset</button>
    </>
  )}
</Counter>
```

## Why snapshot the seed

The naive version reads the prop live in `reset`:

```tsx
// ❌ reset drifts: if initialValue prop changes, reset goes to the NEW value
const reset = () => setCount(initialValue);
```

If the parent re-renders with a different `initialValue` (common — it's often
derived), `reset()` no longer returns to where the component *started*; it jumps
to the latest prop. The whole point of "initializer" is the original seed.
`useRef(initialValue)` captures it once at mount and never updates, so `reset`
is stable. (If you genuinely want reset to track a new seed, that's a *different*
feature — make it explicit, don't get it by accident.)

## TypeScript notes

- `initialValue?` optional with a default in destructuring (`= 0`) keeps the
  component usable with no seed.
- Type the render-prop args as a single named contract so the consumer gets
  autocomplete on everything exposed:

  ```tsx
  type CounterHandlers = {
    count: number;
    increaseBy: (n: number) => void;
    reset: () => void;
    isMax: boolean;
  };
  type CounterProps = {
    initialValue?: number;
    maxCount?: number;
    children: (args: CounterHandlers) => ReactNode;   // render prop, typed
  };
  ```

- `children` typed as `(args: CounterHandlers) => ReactNode` is the render-prop
  contract — see `react-hooks` for when a render prop beats a plain hook (only
  when the parent must pass runtime values into caller-supplied markup).

> Reuse note: the controlled-vs-uncontrolled axis (`control-props.md`) and the
> initializer are orthogonal — a component can be uncontrolled *and* take an
> initial seed (this pattern), or controlled (the parent owns the value, so a
> seed is the parent's job). Pick by who owns the live state.
