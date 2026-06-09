import payload from 'payload';

import { importSeedData } from './seed/import';

import type { SanitizedConfig } from 'payload';

// Payload bin script entry point. Invoked by `pnpm payload seed`.
// Per Payload's custom bin spec the function MUST be a named `script` export.
// Ensures the admin user, then imports all data from src/seed/data/*.json via
// the shared `importSeedData` routine (the single source of seed data).
export const script = async (config: SanitizedConfig): Promise<void> => {
  await payload.init({ config });
  await importSeedData(payload);
  process.exit(0);
};
