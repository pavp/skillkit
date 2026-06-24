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

Context is for parts that are **arbitrarily nested**. For 1–2 fixed levels,
pass state via direct props (`cloneElement` only if unavoidable — React 19
discourages it) — context adds re-renders and boilerplate you may not need.
Use context when prop-drilling through the parts becomes unmanageable.

## Where the type safety lives: the context value

Put the types in the **shared state**, not in the children list. A custom hook
null-checks the context and acts as a type guard, so every part gets a
fully-typed, non-null value without `!`.

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";

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
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
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
