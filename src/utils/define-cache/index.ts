import stringify from 'fast-json-stable-stringify';

// Cap so the cache can't grow unbounded for callers with a large/unbounded argument space. The Map
// preserves insertion order, so the first key is the oldest — evict it (simple FIFO) when over cap.
const MAX_ENTRIES = 256;

// Higher-order memoizer: wraps a pure function so each distinct argument tuple is computed once and
// cached. Separates the caching concern from the compute logic — the wrapped `fn` only computes.
// Arguments must be JSON-serializable; the key uses fast-json-stable-stringify so object key order
// does not change the cache key (plain JSON.stringify would treat {a,b} and {b,a} as distinct).
export const defineCache = <Args extends unknown[], R>(fn: (...args: Args) => R): ((...args: Args) => R) => {
  // Box the value so a cached `undefined` is distinguishable from a cache miss without `has` + `!`.
  const cache = new Map<string, { value: R }>();

  return (...args: Args): R => {
    const key = stringify(args);
    const hit = cache.get(key);
    if (hit !== undefined) return hit.value;
    const value = fn(...args);
    cache.set(key, { value });
    if (cache.size > MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }

    return value;
  };
};
