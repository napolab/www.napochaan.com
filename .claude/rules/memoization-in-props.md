---
description: Wrap callbacks and objects with useCallback/useMemo before passing to children
paths:
  - "src/**/*.tsx"
---

Wrap callback, object, and array values with `useCallback` / `useMemo` when passing to child components or returning from hooks.

- Function → `useCallback`
- Object / array → `useMemo`

```tsx
// Bad — new reference every render
const handler = () => doSomething(id);
const style = { '--z': `${zIndex}` };

return <Child onAction={handler} style={style} />;

// Good — stable references
const handler = useCallback(() => doSomething(id), [id]);
const style = useMemo(() => ({ '--z': `${zIndex}` }), [zIndex]);

return <Child onAction={handler} style={style} />;
```
