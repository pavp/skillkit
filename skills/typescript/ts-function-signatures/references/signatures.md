# TypeScript Function Signatures — worked examples

Reference for designing function/hook/component signatures. Read when a
signature has 3+ params, optional/boolean params, or a return type that varies.

## Positional vs options object

One or two required args: positional is clearest.

```ts
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
```

Three or more args, or several optional/boolean ones: an options object with a
named type. The call site reads as `key: value` instead of a row of unlabeled
arguments.

```ts
type CreateUserOptions = {
  name: string;
  email: string;
  admin?: boolean;
  notify?: boolean;
};

function createUser({ name, email, admin = false, notify = true }: CreateUserOptions): void {
  // …
}

createUser({ name: "Ada", email: "ada@x.com", notify: false }); // labeled, order-free
```

Note: `admin` and `notify` are marked optional (`?`) in the type AND given a
destructuring default. You need both — the default does not make the property
optional in the type.

## All-optional options object: default the whole object

If every property is optional, default the entire object to `{}` so the
function is callable with no arguments. Without it, calling `f()` destructures
`undefined` and throws.

```ts
type FetchOptions = {
  retries?: number;
  timeoutMs?: number;
};

function fetchJson(url: string, { retries = 3, timeoutMs = 5000 }: FetchOptions = {}): void {
  // …
}

fetchJson("/api");                 // ok — uses defaults
fetchJson("/api", { retries: 1 }); // ok — partial override
```

## Union params vs overloads

Default to a union when the return type is the SAME regardless of input.

```ts
function formatId(id: string | number): string {
  return typeof id === "number" ? `#${id}` : id;
}
```

Use overloads ONLY when the return type DEPENDS on the argument type — this is
the one thing a union cannot express.

```ts
function parse(value: string): string[];
function parse(value: number): number[];
function parse(value: string | number): string[] | number[] {
  return typeof value === "string" ? value.split(",") : [value];
}

const a = parse("x,y"); // typed string[]
const b = parse(42);    // typed number[]
```

The TS Handbook says: *always prefer parameters with union types instead of
overloads when possible.* Overloads also let the implementation body contradict
the declared signatures, so the compiler protects you less — use them only when
the return-type variance genuinely requires it.
