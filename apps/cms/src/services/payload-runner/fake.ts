import { vi } from 'vitest';

import type { PayloadRunner } from './index';
import type { Payload } from 'payload';

// Test double for `PayloadRunner`: hands the service a Payload whose `find` /
// `findGlobal` resolve the given docs/global and record their arguments, so a test
// can assert the exact where / sort / depth / limit a service queried with.
export const createFakeRunner = (args: { docs?: unknown[]; global?: unknown }) => {
  const find = vi.fn(async (_options: Record<string, unknown>) => ({ docs: args.docs ?? [] }));
  const findGlobal = vi.fn(async (_options: Record<string, unknown>) => args.global);
  const payload = { find, findGlobal } as unknown as Payload;
  const run: PayloadRunner = async (fn) => fn(payload);

  return { run, find, findGlobal };
};
