# Extensible Styles in TypeScript

Reference for the **extensible styles** pattern. Read this when a component
ships its own baseline look but must let consumers extend or override styling
per instance — without the component hardcoding every visual variant.

## The problem

A component owns its styling (CSS Module, styled-component, Tailwind classes).
Consumers need to layer on extra classes or inline overrides for one instance —
a dark variant, a custom margin, a shadow — without you adding a prop for every
possibility. The contract: accept `className` and `style`, merge them onto the
component's own root, and let the consumer's rules win where they overlap.

## The pattern

Accept optional `className` + `style`, **merge** (not replace) the internal
class with the consumer's, and apply both to the root element.

```tsx
import clsx from "clsx";   // or "classnames" / a local cn() helper
import styles from "./card.module.css";

type CardProps = {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

const Card = ({ className, style, children }: CardProps) => (
  <div className={clsx(styles.card, className)} style={style}>
    {children}
  </div>
);
```

Consumer:

```tsx
<Card className="theme-dark" style={{ boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
  …
</Card>
```

The consumer's `className` comes *after* the internal one, so its rules cascade
last; `style` is applied inline, which beats any class. The internal class is
never overwritten — both ride together.

## The bug: unguarded concatenation

Do NOT build the class with a template literal:

```tsx
// ❌ renders class="card undefined" when no className is passed
<div className={`${styles.card} ${className}`}>
```

When `className` is `undefined`, the template literal stringifies it to the
literal token `"undefined"`, so the element gets a bogus `undefined` class.
`clsx`/`classnames` skip falsy values, so `clsx(styles.card, undefined)` →
`"card"`. If you can't add a dependency, guard manually:
`[styles.card, className].filter(Boolean).join(" ")`.

## Apply to the right element

Merge `className`/`style` onto the component's **own root only** — not blindly
spread onto every child. For a compound component, each part takes its own
`className`/`style` and applies it to *its* root, so consumers can target each
piece (`<Card.Header className="…">`).

## TypeScript notes

- `style?: React.CSSProperties` — the typed inline-style object, so consumers
  get autocomplete and type-checking on CSS keys (`boxShadow`, not `boxShadwo`).
  Don't type it as `string` or `object`.
- `className?: string` — plain optional string.
- When the component forwards the rest of the DOM props too, extend the native
  element's attributes instead of redeclaring: `type CardProps =
  React.ComponentPropsWithoutRef<"div"> & { … }` — `className` and `style` come
  for free, correctly typed, and the consumer can pass any valid `<div>` prop.

> Don't ship dead style props. If a part declares `activeClass?: string` (or any
> styling prop) that nothing applies, remove it — an unused style hook reads as
> a contract the component doesn't honor.
