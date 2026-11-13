import { vi } from 'vitest';

// Browser-test stand-in for `astro:actions` (aliased in vitest.config.ts): the virtual
// module only exists inside an Astro build. Tests drive `actions.submitContact`.
export const actions = {
  submitContact: vi.fn(async (_formData: FormData): Promise<{ data?: unknown; error?: unknown }> => ({ data: { status: 'success' }, error: undefined })),
};
