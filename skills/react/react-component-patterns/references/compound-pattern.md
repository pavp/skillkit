# Compound Components in TypeScript

Reference for the compound pattern. Read this when implementing a layout
component whose parts share state (Tabs, Accordion, Menu, Toolbar).

## When to use it

Compound components are for **layout**, not data. Reach for them when a parent
and its parts form a cohesive unit and the caller arranges the pieces:

```tsx
<Tabs defaultTab="profile">
  <Tabs.List>
    <Tabs.Tab value="profile">Profile</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="profile">…</Tabs.Panel>
  <Tabs.Panel value="settings">…</Tabs.Panel>
</Tabs>
```

If the children are driven by **data** (`items.map(...)`), it is a list — use
`props` + `.map()`, not compound. The urge to restrict which children are
allowed is the tell that you picked the wrong pattern.

## Do you even need context?

First, do the parts even **share state**? If each part is self-contained — a
Header, a Body, a Footer that don't read each other's state — there's nothing to
share: expose them as a namespace and pass each its own props. That's valid
composition, not a context compound. Context is for *shared* state only.

If they do share state, the second question is **nesting**. Context is for parts
that are arbitrarily nested. For 1–2 fixed levels, pass the shared state via
direct props (`cloneElement` only if unavoidable — React 19 discourages it) —
context adds re-renders and boilerplate you may not need. Use context when
prop-drilling the shared state through the parts becomes unmanageable.

## Where the type safety lives: the context value

Put the types in the **shared state**, not in the children list. A custom hook
null-checks the context and acts as a type guard, so every part gets a
fully-typed, non-null value without `!`.

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type TabsContextValue = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

// The type guard: throws outside <Tabs>, returns a non-null value.
const useTabsContext = (): TabsContextValue => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.* must be used inside <Tabs>");
  return ctx;
};

const Tabs = ({ defaultTab, children }: { defaultTab: string; children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  // Cheap habit, not required: the memo only helps if the provider re-renders
  // for reasons other than `activeTab` changing (and React 19's compiler does it).
  const value = useMemo(() => ({ activeTab, setActiveTab }), [activeTab]);
  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
};

const TabList = ({ children }: { children: ReactNode }) => (
  <div role="tablist">{children}</div>
);

const Tab = ({ value, children }: { value: string; children: ReactNode }) => {
  const { activeTab, setActiveTab } = useTabsContext(); // typed, no `!`
  return (
    <button role="tab" aria-selected={activeTab === value} onClick={() => setActiveTab(value)}>
      {children}
    </button>
  );
};

const Panel = ({ value, children }: { value: string; children: ReactNode }) => {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null;
  return <div role="tabpanel">{children}</div>;
};

// Expose the parts as a namespace.
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = Panel;

export { Tabs };
```

**On the `useMemo` above — it's conditional, not a rule.** It only earns its
keep when the provider can re-render for reasons *other* than the value
changing (extra props/state, or a re-rendering parent). When the provider's only
state is the value itself — like `activeTab` here — consumers must re-render
when it changes anyway, so the memo barely helps; keep it as a cheap habit, not
a requirement. **React 19 with the React Compiler memoizes this automatically —
hand-written `useMemo` is redundant there.**

> This block type-checks under `strict: true` with `@types/react`
> (`jsx: "react-jsx"`). Keep it that way if you edit it.

## Don't police the children with types

Avoid typing `children` as `ReactElement<TabProps>[]` to force "only `<Tab>` in
here." TypeScript checks this unreliably (open issue since 2018) and it breaks
on `.map()`, conditionals, fragments, and wrapper components. A stray child is
harmless — it just renders as inert markup. Safety belongs in the context value.

## Going further: compile-checked tab values

To make `<Tab value="billing">` valid but `<Tab value="typo">` a compile error,
wrap the whole thing in a factory that threads a union type through the context:

```tsx
const { Tabs, Tab, Panel } = createTabs<"profile" | "settings" | "billing">();
```

One gotcha: define `useTabsContext` **inside** the factory so it closes over
that call's context. A module-level hook would read a different context object
and throw at runtime.

## Gotcha: parts wrapped in `memo` / `forwardRef`

The plain-arrow parts above let `Tabs.List = TabList` infer cleanly. But wrap a
part in `memo()` or `forwardRef()` and the inferred namespace breaks — the
wrapped value is a `MemoExoticComponent` / `ForwardRefExoticComponent`, not a
function, so assigning it errors (`Property 'Tab' does not exist…`) or the JSX
fails with `TS2604: … no construct or call signatures`.

Fix: stop relying on inference — **declare the namespace with an explicit
interface** and type each part with `typeof` (which preserves its props).
Illustrative fragment (`TabProps`/`TabsProps`/`TabsRoot` stand in for the
worked example's types above):

```tsx
const Tab = memo(({ value, children }: TabProps) => { /* … */ });

interface TabsComponent {
  (props: TabsProps): ReactNode;   // call signature = the parent
  Tab: typeof Tab;                 // typeof keeps the wrapped part's props
  Panel: typeof Panel;
}

// Parts must be NON-optional in the interface — an optional `Tab?:` puts
// `undefined` in the union and breaks the JSX element type.
const Tabs = Object.assign(TabsRoot, { Tab, Panel }) as TabsComponent;
```

Wrapping order: `memo(forwardRef(...))`, not the reverse. Set `displayName` on
each wrapped part or DevTools shows `Anonymous`. **React 19**: `ref` is a plain
prop, so you can drop `forwardRef` entirely — parts stay plain functions and the
inferred namespace keeps working without the explicit interface.
