import { vi } from 'vitest';

// Browser-test stub for `next/cache`. The payload data helpers wrap their
// queries in `unstable_cache` and call `revalidateTag`/`revalidatePath` from
// collection hooks. Pulling the real Next server-cache internals into the
// browser bundle makes Vite discover them mid-run and reload, failing in-flight
// test imports. These helpers never run in browser tests (the data layer is
// mocked per-test), so `unstable_cache` is a passthrough and the revalidators
// are no-ops. Aliased only in the browser vitest project.
export const unstable_cache = <T extends (...args: never[]) => unknown>(fn: T): T => fn;
export const revalidateTag = vi.fn();
export const revalidatePath = vi.fn();
