---
name: style-in-regime
description: "Trigger: MUI sx vs SCSS modules, inline style, styled-components, Tailwind arbitrary values, should this be a class. Detects the project's styling regime and classifies each inline style against it; a judgment authority, never edits."
license: Apache-2.0
metadata:
  author: pedro-villarreal(pavp)
  version: "1.0.0"
---

# Style In Regime

The judgment authority on whether a piece of styling lives where its regime says it should. Detects the project's styling regime, then classifies each inline style; never edits — the actor applies.

## Activation Contract

Load when EXISTING React styling needs a verdict: a cleanup actor hands one over, or a human asks directly ("should this `sx` be a module?", "move this to a class?"), or reviewing styling in a diff. Not for authoring new styles or picking a library for a greenfield project — the caller supplies the code and its regime. React styling only, not language-agnostic.

## Hard Rules

- **Judge, never act.** One verdict per styling site. Never move, rewrite, extract, or rename — classify/keep/flag only.
- **Detect the regime BEFORE judging** (Regime Detection gate). Inline-only project (no style-file system) → every site is `defer-regime`; impose nothing.
- **Core rule (regime-agnostic):** static, reusable styling belongs in the regime's canonical unit; inline (`sx`, `style`, CSS-in-JS runtime) is justified ONLY for dynamic-per-render values, theme-token one-offs, or a single-instance override. React's own guidance: static → file, dynamic → inline (runtime injection recalculates every render).
- **Uncertainty → `clean`.** A wrong move churns JSX and class names; doubt that a site is truly static-and-reusable drops the smell.
- **Judge placement, not design.** Whether a value is a *good* color/spacing is out of scope; naming the extracted class → `clean-names`.
- **Per-regime smells deferred.** The canonical unit and smell shape per regime live in `references/regime-tables.md`; read it before emitting a regime-specific smell.

## Decision Gates

**Regime Detection** — resolve once, top match wins:

| Signal in project | Regime | Canonical unit |
|---|---|---|
| `*.module.scss` / `*.module.css` present | CSS/SCSS Modules | the `.module.*` file |
| `tailwind.config.*` present | Tailwind | utility classes / `@apply` |
| `styled-components` / `@emotion` imports | CSS-in-JS | `styled.X` / token |
| plain `.css` + `className`, no module | Plain CSS | the `.css` file |
| none of the above (inline-only) | — | `defer-regime` |

**Verdict** — per styling site, once the regime is known:

| Styling site (the citable trigger) | Verdict |
|---|---|
| Value depends on state/prop, computed per render | `justified-dynamic` |
| One-off read of a theme token, not repeated | `justified-theme` |
| Overrides one prop on a single instance | `justified-override` |
| Static + reusable, and the regime HAS a canonical unit | `smell` (move to canonical unit) |
| Regime is inline-only (no style-file system) | `defer-regime` |
| None fires | `clean` |

## Execution Steps

1. Run Regime Detection; name the regime + canonical unit. Inline-only → all sites `defer-regime`, stop.
2. Per styling site, test the Verdict gate top-down; first fired row wins, else `clean`.
3. For a `smell`, cite the target unit from `references/regime-tables.md`; suggest the boundary, do not write it.

## Output Contract

Per styling site: `file:line` + detected regime + verdict (`justified-*`, `smell`, `defer-regime`, or `clean`) + a one-clause reason +, for a `smell`, the canonical unit to move to (omit for `clean`). A classification the caller consumes — no edits. For a human asking directly, phrase it plainly.

## References

- `references/regime-tables.md` — per-regime canonical unit and smell shape (CSS/SCSS Modules, Tailwind, CSS-in-JS, Plain CSS), with the dynamic/theme/override justifications and bad/good examples per regime.
