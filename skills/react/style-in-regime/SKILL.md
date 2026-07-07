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

- **Judge, never act.** One verdict per styling site — classify only; never move, rewrite, extract, or rename.
- **Detect the regime per FILE** (not project-wide: a repo mid-migration mixes regimes). No style-file system → `defer-regime`; a system present but unrecognized → `unrecognized-regime`, never guess.
- **Core rule (regime-agnostic):** static, reusable styling belongs in the regime's canonical unit; inline (`sx`, `style`, CSS-in-JS runtime) is justified ONLY for dynamic-per-render values or an inline one-off. This is React's own guidance — runtime injection recalculates every render.
- **Uncertainty → `clean`.** A wrong move churns JSX and class names.
- **Judge placement, not design or shape.** Value quality is out of scope; naming the extracted class → `clean-names`; body duplication/shape → `clean-structure`. This skill owns only WHERE a style lives.
- **Per-regime smells deferred** to `references/regime-tables.md`; read it before emitting a regime-specific smell.

## Decision Gates

**Regime Detection** — per the site's OWN file/nearest boundary, top match wins:

| Signal at the site's file/boundary | Regime | Canonical unit |
|---|---|---|
| co-located `*.module.scss` / `*.module.css` | CSS/SCSS Modules | the `.module.*` file |
| `tailwind.config.*` in scope | Tailwind | utility classes / `@apply` |
| `styled-components` / `@emotion` import | CSS-in-JS | `styled.X` / token |
| plain `.css` + `className`, no module | Plain CSS | the `.css` file |
| no style-file system at all | inline-only | `defer-regime` |
| system present but no signal matches (vanilla-extract, panda) | unknown | `unrecognized-regime` (surface gap, don't guess) |

**Verdict** — per styling site, once its regime is known:

| Styling site (the citable trigger) | Verdict |
|---|---|
| Value depends on state/prop, computed per render | `justified-dynamic` |
| A theme-namespaced token, OR one prop overridden on a single instance | `justified-inline` |
| Static + reusable (≥2 distinct components/files), regime HAS a canonical unit | `smell` (move to canonical unit) |
| None fires, or doubt whether truly static-and-reusable | `clean` |

## Execution Steps

1. Per styling site, run Regime Detection against its OWN file. `defer-regime` / `unrecognized-regime` → emit that, next site.
2. Test the Verdict gate top-down; first fired row wins, else `clean`.
3. For a `smell`, cite the target unit from `references/regime-tables.md`; suggest the boundary, do not write it. If that reference cannot be read, downgrade to `clean` (uncertainty → clean) — never cite a unit you cannot back.

## Output Contract

One line per site: `file:line` — regime — verdict — one-clause reason — (for `smell`) the canonical unit to move to. A classification the caller consumes; no edits. Worked example in `references/regime-tables.md`.

## References

- `references/regime-tables.md` — per-regime canonical unit + smell shape (CSS/SCSS Modules, Tailwind, CSS-in-JS, Plain CSS), the `justified-inline` cases, bad/good examples, and a worked Output-Contract line.
- `clean-names` — naming the extracted class; `clean-structure` — duplication/shape of the code body.
