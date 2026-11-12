// CI guard: fail before any production deploy when the cms wrangler config lacks the
// Cloudflare Access AUDs (an Access-less cms would be a public Payload login).
// Usage: node scripts/check-access-aud.mjs <env>   (from apps/cms)
import { fileURLToPath } from 'node:url';

import { findAccessAUDProblems, readEnvVars } from './check-access-aud/index.mjs';

const CONFIG_PATH = fileURLToPath(new URL('../wrangler.jsonc', import.meta.url));
const envName = process.argv[2] ?? 'production';

const problems = findAccessAUDProblems(readEnvVars(CONFIG_PATH, envName));

if (problems.length > 0) {
  for (const problem of problems) console.error(`::error file=apps/cms/wrangler.jsonc::env.${envName}.vars.${problem}`);
  console.error('Create the cms host Access app and commit its AUD first (docs/production-deploy.md).');
  process.exit(1);
}

console.log(`env.${envName}: Cloudflare Access AUDs are set.`);
