<!-- skillkit react snippet v1.0.0 — paste into your React project's AGENTS.md. Re-copy after `npx skills update`. -->
## React skills (skillkit)

Before you create or edit a `.tsx`/`.jsx` file or a `use*` hook, load the matching skill by name — through your skill tool, or by reading its whole `SKILL.md` — even when the request names a feature or a bug, not a component. When you delegate such an edit, name these skills in the delegation prompt. Skip a skill that is not installed.

| You are about to… | Load |
|---|---|
| create or edit a component | `react-component` |
| create or edit a `use*` hook, or repeat stateful logic another component already has | `react-hooks` |
| shape a reusable component API: parts sharing state, `value`+`onChange`, slots, state seeded from props | `react-component-patterns` |
| write, keep, or remove `useMemo`, `useCallback`, or `memo` | `react-memoization` |
| add or change an inline style (`style`, `sx`, CSS-in-JS, Tailwind arbitrary values) | `style-in-regime` |

Rules that hold even when no skill was loaded:

- Call hooks only at the top level — never in conditions, loops, or callbacks.
- Containers own state and effects; presentational components are pure props → JSX, with no data fetching.
- Derive values during render; never mirror props into state.
- Custom hooks own logic and never return JSX; a hook is the first choice for reusing logic.
- No speculative memoization: memoize for semantic identity, or for a cost you can cite.
- Static, reusable styling belongs in the project's style unit; inline only for per-render values or a one-off.
