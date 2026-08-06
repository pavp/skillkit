# Naming criteria — the detailed judgment

One axis behind every verdict: **does the name reveal intent?** A competent reader should know what an identifier holds or does without a comment and without reading the body. Code shows structure; a name must supply meaning. If a name needs a comment to be understood, it fails — fix the name, don't add the comment.

## The reveal-intent test (the master decision)

Operative question: *reading only this name at a call site, do I know what it holds or does?*
- **Yes** → the name carries its intent → `clean`.
- **No** → it hides intent behind a letter, an abbreviation, an encoding, or an implementation detail → flag the specific rule below.

Everything below is this one test applied to specific shapes. When a name trips several gates, the topmost row in the SKILL's Decision Gates table wins — the row order IS the tie-break authority (N6 sits first because it is purely lexical; the rest follow that order). The rules are language-agnostic — examples use TypeScript, but a cryptic Python `def d(x):` fails N1 and a Go `func Proc()` fails N1/N4 just the same.

## N6 — Avoid encodings (checked first: purely lexical)

Type/scope encoded into the name. Modern editors show types; the encoding is noise and lies when the type changes. Lexical, so it is decided before the semantic rules.

```ts
// Bad — Hungarian notation
const strName = "Alice";
const arrUsers: string[] = [];
const nCount = 0;

// Good
const name = "Alice";
const users: string[] = [];
const count = 0;

// Bad — interface prefix
interface IUserRepository { findById(id: string): Promise<unknown>; }

// Good — the NAME loses the `I`; structure is ts-types' call, not ours
interface UserRepository { findById(id: string): Promise<unknown>; }
```

The `I`-prefix case is TypeScript-specific; Hungarian and type-prefixes exist across languages. Boundary (TypeScript): we flag the `I` (a name encoding); whether the interface should be flat, extend another, or be a type alias is **`ts-types`**, not us.

## N7 — Names must describe side effects

If a function does more than its name promises (mutation, IO, creation), the name is misleading — the most dangerous naming failure, because the caller trusts it.

```ts
const configStore = new Map<string, string>();

// Bad — name hides the write
function getConfig(configPath: string) {
  if (!configStore.has(configPath)) configStore.set(configPath, "{}"); // hidden!
  return JSON.parse(configStore.get(configPath) ?? "{}");
}

// Good — name reveals the create
function getOrCreateConfig(configPath: string) {
  if (!configStore.has(configPath)) configStore.set(configPath, "{}");
  return JSON.parse(configStore.get(configPath) ?? "{}");
}
```

Boundary: we flag the NAME not matching the effect. The param shape (positional vs options) is **`ts-function-signatures`**.

## N1 — Descriptive names

A name that needs a comment to be understood doesn't reveal intent.

```ts
const d = 86400;                 // Bad — what is d?
const SECONDS_PER_DAY = 86400;   // Good

function proc(values: number[]) { return values.filter((v) => v > 0); }        // Bad
function filterPositiveNumbers(numbers: number[]) { return numbers.filter((n) => n > 0); } // Good
```

## N2 — Right level of abstraction

Name the intent, not the implementation. The data structure is free to change; the name should not leak it.

```ts
function getMapOfUserIdsToNames() { /* ... */ }  // Bad — leaks the Map
function getUserDirectory() { /* ... */ }        // Good — abstracts it
```

## N3 — Standard nomenclature

Use domain terms, design-pattern names, and known conventions. A standard term always beats an invented one, and it is the preferred suggestion for any violation.

```ts
class UserFactory { create(data: unknown) { /* ... */ } }               // pattern name
function calculateAmortization(principal: number, rate: number, term: number) { /* ... */ } // domain term
```

## N4 — Unambiguous

The reader must be able to tell what the name acts on.

```ts
function rename(source: string, target: string) { /* ... */ }       // Bad — rename what?
function renameFile(oldPath: string, newPath: string) { /* ... */ } // Good
```

## N5 — Length matches scope

Short names suit tiny scopes; long scopes need descriptive names. Judge length against the scope you can actually see — if the scope is unavailable, you cannot run this test, so degrade to `clean`.

```ts
const total = numbers.reduce((sum, n) => sum + n, 0);   // Good — tiny scope
const MAX_RETRY_ATTEMPTS_BEFORE_FAILURE = 5;            // Good — module scope
const MAX = 5;                                          // Bad — too short at module scope
```

## Verdict quick reference

| Verdict | Principle | Fix direction |
|---------|-----------|---------------|
| N1 | Descriptive | `SECONDS_PER_DAY` not `d` |
| N2 | Right abstraction | `getUserDirectory()` not `getMapOf…` |
| N3 | Standard term | `UserFactory`, `calculateAmortization` |
| N4 | Unambiguous | `renameFile(oldPath, newPath)` |
| N5 | Length vs scope | short in loops, long at module scope |
| N6 | No encoding | `users` not `arrUsers`; `UserRepository` not `IUserRepository` |
| N7 | Describe side effects | `getOrCreateConfig()` |
| clean | Reveals intent, honest, no encoding | — |

## The boundary (what clean-names does NOT judge)

Naming (N1–N7) is language-agnostic. The type/signature/module rows below are the TypeScript deferral; in other languages, judge the name and leave those concerns to that language's tooling. Applying the rename is always the actor's job.

| Concern | Authority |
|---------|-----------|
| Does the NAME reveal intent (N1–N7) | **clean-names** (any language) |
| What type/shape to model (union, interface, enum, guard) | `ts-types` (TypeScript) |
| Signature shape (positional vs options, overloads, defaults) | `ts-function-signatures` (TypeScript) |
| Module/import/barrel naming and placement | `ts-module-organization` (TypeScript) |
| Applying the rename (safe, zone-bounded) | `leave-it-cleaner` (the actor) |

Philosophy: **the best name needs no comment.** If you reach for a comment to explain what an identifier is, rename it first.
