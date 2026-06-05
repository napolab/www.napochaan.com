---
paths:
  - "src/**/*.tsx"
---

# Rendering Optimization

Patterns for optimizing rendering in React. Split component boundaries appropriately to minimize update scope.

## Core Principle

Each piece of state should be owned by the smallest component possible. Only components that depend on changed state should re-render.

## Separating Read-Only / Write-Only Concerns

For **read-only** or **write-only** cases, separate components to prevent unnecessary re-renders:

```tsx
// Bad - Parent re-renders on every count change even though button doesn't need count
const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
};

// Good - Split into display and control components
const CountDisplay = ({ count }: { readonly count: number }) => {
  return <span>{count}</span>;
};

const IncrementButton = ({ onIncrement }: { readonly onIncrement: () => void }) => {
  return <button onClick={onIncrement}>Increment</button>;
};
```

## Component Boundary Splitting

Split frequently updating parts into smaller components to limit re-render scope:

```tsx
// Bad - Large component re-renders entirely when notifications update
const Dashboard = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  return (
    <div>
      <Header />
      <NotificationBadge count={notifications.length} />
      <Settings data={settings} />
    </div>
  );
};

// Good - Isolate frequently updating state into its own component
const Dashboard = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  return (
    <div>
      <Header />
      <NotificationBadge /> {/* Manages its own state internally */}
      <Settings data={settings} />
    </div>
  );
};

const NotificationBadge = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Only this component re-renders when notifications change
  return <span>{notifications.length}</span>;
};
```

## Derived State: useMemo for Object Parts

Subscribe only to specific properties of large objects using `useMemo`:

```tsx
// Bad - Component re-renders when any user property changes
const UserName = ({ user }: { readonly user: User }) => {
  return <span>{user.name}</span>;
};

// Good - Memoize derived values to prevent unnecessary re-renders in children
const UserProfile = ({ user }: { readonly user: User }) => {
  const name = useMemo(() => user.name, [user.name]);
  const email = useMemo(() => user.email, [user.email]);

  return (
    <div>
      <UserNameDisplay name={name} />
      <UserEmailDisplay email={email} />
    </div>
  );
};

// Even better - pass primitive props to memoized children
const UserNameDisplay = memo(({ name }: { readonly name: string }) => {
  return <span>{name}</span>;
});
```

## List Optimization with React.memo + Key

Ensure updating one list item doesn't re-render others:

```tsx
// Bad - All items re-render when any item changes
const TodoList = ({ todos, onToggle }: TodoListProps) => {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => onToggle(todo.id)}
          />
          {todo.title}
        </li>
      ))}
    </ul>
  );
};

// Good - Individual items are memoized
const TodoList = ({ todos, onToggle }: TodoListProps) => {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} />
      ))}
    </ul>
  );
};

const TodoItem = memo(({ todo, onToggle }: TodoItemProps) => {
  const handleToggle = useCallback(() => {
    onToggle(todo.id);
  }, [todo.id, onToggle]);

  return (
    <li>
      <input type="checkbox" checked={todo.done} onChange={handleToggle} />
      {todo.title}
    </li>
  );
});
```

## Heavy Computation: useMemo

Don't perform heavy computation during every render. Memoize the result:

```tsx
// Bad - Filtering runs on every render
const FilteredList = ({ items, query }: FilteredListProps) => {
  const filtered = items.filter((item) => heavyMatch(item, query));
  return <List items={filtered} />;
};

// Good - Memoized computation
const FilteredList = ({ items, query }: FilteredListProps) => {
  const filtered = useMemo(
    () => items.filter((item) => heavyMatch(item, query)),
    [items, query],
  );
  return <List items={filtered} />;
};
```

## Server Components as Optimization

In vinext, Server Components don't re-render on the client at all. Use them to keep expensive rendering on the server:

```tsx
// Server Component - zero client-side JS, never re-renders
const ProductList = async () => {
  const products = await fetchProducts();
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
};

// Only interactive parts need 'use client'
'use client';
const AddToCartButton = ({ productId }: { readonly productId: string }) => {
  const handleClick = useCallback(() => {
    addToCart(productId);
  }, [productId]);

  return <button onClick={handleClick}>Add to Cart</button>;
};
```

## When to Optimize

| Situation                         | Recommendation                                   |
| --------------------------------- | ------------------------------------------------ |
| Properties change independently   | `useMemo` + pass primitives to memoized children |
| Updating individual list items    | `React.memo` + stable `key` + `useCallback`      |
| Write-only interaction            | Split into separate component                    |
| Frequently updating parts         | Component boundary splitting                     |
| Static content                    | Server Component (no client JS)                  |
| Properties always change together | No optimization needed (overhead is wasteful)    |
