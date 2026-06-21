# ts-types — worked examples

Read when modeling a value set, validating a config object, or narrowing
untrusted input — for the concrete TypeScript syntax behind the skill's rules.

## Value set: union vs const object

```ts
// Type only — zero runtime cost, tree-shakeable. Use when you never need the values.
type Status = "active" | "inactive";

// Runtime values too — iterate, validate, autocomplete. Single source of truth.
const STATUS = { active: "active", inactive: "inactive" } as const;
type StatusValue = (typeof STATUS)[keyof typeof STATUS];

Object.values(STATUS); // available at runtime, unlike the bare union
```

Avoid `enum`: larger bundle, poor tree-shaking, and `const enum` has its own
inlining caveats. A union or a `const` object covers nearly every case.

## `satisfies` vs `as`

```ts
type Config = { port: number; host: string };

// ❌ as — asserts the type; a MISSING field slips through with no error
const bad = { port: 3000 } as Config; // compiles, but `host` is absent at runtime
bad.host.toUpperCase();                // typed string → crashes at runtime

// ✅ satisfies — validates against Config (the missing `host` IS an error here)
//    and keeps the precise inferred shape
const config = { port: 3000, host: "localhost" } satisfies Config;
config.port; // number — the object keeps its precise shape, not widened to Config
```

Use `satisfies` for config objects, discriminated-union maps, and any literal
you want validated without losing inference. Reserve `as` for the rare case
where you genuinely know more than the compiler and validation already happened.

## Type guard vs assertion function

```ts
type User = { id: string; name: string };

// Type guard — narrows inside the conditional block only.
function isUser(v: unknown): v is User {
  return typeof v === "object" && v !== null && "id" in v && "name" in v;
}

// Assertion function — throws on failure, narrows for the REST of the scope.
function assertUser(v: unknown): asserts v is User {
  if (!isUser(v)) throw new Error("not a User");
}

function handle(input: unknown) {
  assertUser(input);
  input.name; // typed as User from here on — no if-block needed
}
```

Guard for conditional logic; assertion to validate external input once at a
boundary. Both beat `as` — never assert your way past untrusted data.

## Flat interfaces

```ts
// ✅ nested object → its own named interface, referenced
interface Address { street: string; city: string; }
interface User { id: string; name: string; address: Address; }

// ❌ inline nested object type
interface BadUser { address: { street: string; city: string } }
```
