import payload from 'payload';

import { importContent } from './import';

import type { SanitizedConfig } from 'payload';

// Production initial seed: content ONLY. Unlike the dev seed (`seed:import` /
// `payload:seed`, which also creates a `dev@napochaan.com` / `password` admin),
// this script intentionally seeds NO user. The production admin is created via
// Payload's create-first-user onboarding screen on first deploy — in production
// NODE_ENV=production sets autoLogin=false, and an empty users collection
// triggers the onboarding flow. This guarantees no weak seed credentials ever
// reach production.
//
// Payload bin script entry point. Invoked by `pnpm seed:import:prod`.
// Per Payload's custom bin spec the function MUST be a named `script` export.
export const script = async (config: SanitizedConfig): Promise<void> => {
  await payload.init({ config });
  await importContent(payload);
  process.exit(0);
};
