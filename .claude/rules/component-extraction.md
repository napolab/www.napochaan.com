---
description: Extract render blocks with closures over hook state or repeated JSX into separate components
paths:
  - "src/**/*.tsx"
---

Extract render blocks into separate components when they reference hook state through closures or repeat the same structure.

Closures over hook state hide data dependencies. Explicit props make the component's requirements visible.

## When to extract

- A render block uses a closure helper that accesses hook state (e.g. `getItem`, `buildStyle`)
- OR the same JSX structure and prop patterns repeat 2+ times

## After extraction

- Pass data explicitly via props — never through closures
- Destructure hook results directly instead of wrapping in lookup helpers

```tsx
// Bad — closure over hook state
const Parent = () => {
  const items = useZIndex(defs);
  const getItem = (id: string) => items.find((i) => i.id === id)!;

  return (
    <>
      <Window zIndex={getItem('a').zIndex} />
      <Window zIndex={getItem('b').zIndex} />
    </>
  );
};

// Good — destructure and pass via props
const Parent = () => {
  const [a, b] = useZIndex(defs);

  return (
    <>
      <Window zIndex={a.zIndex} bringToFront={a.bringToFront} />
      <Window zIndex={b.zIndex} bringToFront={b.bringToFront} />
    </>
  );
};

// Good — repeated structure extracted as a component with explicit props
const FeatureWindow = ({ zIndex, bringToFront, inView }: Props) => {
  const cmd = useTypewriter(command, { startWhen: inView });
  // ...
};
```
