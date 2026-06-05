---
paths:
  - "src/**/*.{ts,tsx}"
---

# Software Design Principles

This project follows strict software design principles. The user expects highly testable code that adheres to these guidelines.

## Test-Driven Development (TDD)

Follow t-wada's TDD methodology:

1. **Red**: Write a failing test first that describes the expected behavior
2. **Green**: Write the minimum code necessary to make the test pass
3. **Refactor**: Improve the code while keeping tests green

Always write tests before implementation. Tests serve as executable specifications and documentation.

## Command/Query Separation (CQS)

Strictly separate operations into two categories:

- **Commands**: Perform actions, mutate state, return `void`
- **Queries**: Return data, have no side effects, are idempotent

Never mix commands and queries in the same method.

## Open/Closed Principle (OCP)

Design modules that are:

- **Open for extension**: New behavior can be added without modifying existing code
- **Closed for modification**: Existing code remains unchanged when adding features

Achieve this through:

- Dependency injection (inject services, not instantiate them)
- Interface-based programming
- Strategy patterns where behavior varies

## Testability First

Write code with testing as a primary concern:

- Inject dependencies rather than creating them internally
- Avoid static methods and singletons that are hard to mock
- Keep functions pure where possible
- Design small, focused units with single responsibilities

### Example: Testable Service

```typescript
// Testable - dependencies injected
export const createUserService = (
  repository: UserRepository,
  notifier: NotificationService
): UserService => ({
  createUser: async (data) => {
    const user = await repository.save(data);
    await notifier.notify(user.id, "welcome");
    return user;
  },
});

// Hard to test - creates own dependencies
export const createUserService = (): UserService => {
  const repository = new UserRepository();  // Cannot mock
  const notifier = new NotificationService();  // Cannot mock
  return { ... };
};
```
