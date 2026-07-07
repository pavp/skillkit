# Per-Regime Tables

The core rule (static → canonical unit, inline → dynamic or inline-one-off only) is regime-agnostic. This file gives the canonical unit and the smell shape for each detected regime, the shared justifications, and one worked Output-Contract line.

## Shared justifications (apply in every regime)

An inline style (`sx`, `style`, runtime CSS-in-JS object) is NOT a smell when:

- `justified-dynamic` — the value is computed from state/props per render. A static class cannot express it. Example: `sx={{ width: `${pct}%` }}`.
- `justified-inline` — an inline one-off a static unit would only bloat: a theme-namespaced token (`sx={{ color: 'primary.main' }}`) OR one property overridden on a single instance (`sx={{ mt: 2 }}`). If a value is BOTH, it is still one verdict: `justified-inline`.

Reusable = the same static styling appears on ≥2 distinct components/files. Below that AND doubt → `clean`. Static AND reusable AND the regime has a canonical unit → `smell`. A repeated theme token stays `justified-inline` no matter how many components read it — the token IS the shared unit; nothing is copied to extract.

## Worked Output-Contract line

```
Card.tsx:42 — CSS/SCSS Modules — smell — static, reused on Card + Tile — move to Card.module.scss
Badge.tsx:9 — CSS-in-JS — justified-dynamic — width driven by `pct` prop
Tile.tsx:15 — CSS/SCSS Modules — justified-inline — theme token `primary.main`, reused but not copied
```

## CSS / SCSS Modules

- Canonical unit: the co-located `*.module.scss` (or `*.module.css`), consumed via `className={styles.x}`.
- Smell: static styling in `sx` / `style` when a module exists. Runtime injection (emotion under MUI `sx`) recalculates per render; the module is a static class hash, extractable and cacheable.

```tsx
// smell — static, belongs in the module
<Box sx={{ padding: 16, borderRadius: 8, background: '#fff' }} />

// clean — static in the module, dynamic stays inline
<Box className={styles.card} sx={{ width: `${pct}%` }} />
```

## Tailwind

- Canonical unit: utility classes in `className`; repeated clusters extracted via `@apply` in a CSS layer.
- Smell (Tailwind-specific): arbitrary values `w-[347px]`, `text-[#3a3a3a]` where a theme token exists (`w-72`, `text-slate-700`); and inline `style`/`sx` for what a utility already covers. Arbitrary values are the Tailwind equivalent of magic numbers — they bypass the design tokens.

```tsx
// smell — arbitrary values bypass tokens
<div className="w-[347px] text-[#3a3a3a]" />

// clean — tokens; arbitrary only when truly one-off and tokenless
<div className="w-72 text-slate-700" />
```

## CSS-in-JS (styled-components / emotion)

- Canonical unit: a `styled.X` component or a shared style object/token, defined once outside the render path.
- Smell: a static style object built inline in JSX (re-allocated each render, no name, not reusable) when a `styled` component or token would name and share it.

```tsx
// smell — static object inline, re-allocated per render
<div css={{ display: 'flex', gap: 8, padding: 16 }} />

// clean — named, defined once
const Row = styled.div`display:flex; gap:8px; padding:16px;`
```

## Plain CSS + className

- Canonical unit: the `.css` file, consumed via `className`.
- Smell: static styling in the `style` prop when a stylesheet + class is the project's pattern. Dynamic values stay in `style`.

```tsx
// smell — static in style prop
<button style={{ color: 'green', fontWeight: 600 }} />

// clean — class for static, style only for dynamic
<button className="success" style={{ opacity }} />
```

## Regime-agnostic boundary

- Whether a value is a *good* design choice (color, spacing scale) is out of scope — that is a design-system concern, not placement.
- Naming of the extracted class/component is out of scope here; hand naming to `clean-names`.
- If the project has NO style-file system (inline-only), there is no canonical unit to move to → `defer-regime`, impose nothing.
- If a style-file system IS present but matches none of the regimes above (vanilla-extract, panda, a custom setup) → `unrecognized-regime`: name the unrecognized system, emit no smell, and surface that this skill has no table for it. Do NOT fall back to another regime's canonical unit.
