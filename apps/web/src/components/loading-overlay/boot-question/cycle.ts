// Framework-free pieces of the BootQuestion cycle, shared by the React BootQuestion
// (./index.tsx) and the `<boot-question>` custom element (./element.ts).

// Pure cycle step, extracted so the wrap-around is unit-testable.
export const nextIndex = (current: number, length: number): number => (current + 1) % length;

// Pure shuffle (decorate–sort–undecorate): tag each item with a drawn key, sort by
// it, drop the key. `random` is injected so tests stay deterministic; production
// passes Math.random. Never mutates the input — the `map` builds a fresh array.
export const shuffle = <T>(items: readonly T[], random: () => number): T[] =>
  items
    .map((item) => ({ item, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);

// How long a finished prompt stays on screen before the next begins typing.
export const HOLD_MS = 1800;
