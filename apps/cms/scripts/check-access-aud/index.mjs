import { experimental_readRawConfig } from 'wrangler';

// Both must be set before a production deploy: without CF_ACCESS_AUD the Access plugin is
// disabled and the cms host serves a public Payload password login; without
// CF_ACCESS_MCP_AUD /mcp answers 500. (docs/production-deploy.md, docs/cloudflare-access.md)
export const ACCESS_AUD_VARS = /** @type {const} */ (['CF_ACCESS_AUD', 'CF_ACCESS_MCP_AUD']);

// A Cloudflare Access application AUD tag is 64 lowercase hex characters. Checking the
// shape (not a list of placeholder words) rejects TODO / <aud> / truncated copies alike.
const ACCESS_AUD_SHAPE = /^[0-9a-f]{64}$/;

/** @param {unknown} value */
const isAccessAUD = (value) => typeof value === 'string' && ACCESS_AUD_SHAPE.test(value);

/** @param {unknown} value @returns {value is Record<string, unknown>} */
const isRecord = (value) => typeof value === 'object' && value !== null;

/**
 * @param {Record<string, unknown> | undefined} vars the env's `vars` block
 * @returns {string[]} one message per missing or malformed AUD var (empty when deployable)
 */
export const findAccessAUDProblems = (vars) =>
  ACCESS_AUD_VARS.filter((name) => !isAccessAUD(vars?.[name])).map((name) => `${name} is missing or not a 64-hex Access AUD tag (got ${JSON.stringify(vars?.[name])})`);

/**
 * Reads `env.<envName>.vars` with wrangler's own JSONC parser. Top-level `vars` are not
 * inherited by named envs in wrangler, so they are deliberately not consulted.
 * @param {string} configPath
 * @param {string} envName
 * @returns {Record<string, unknown> | undefined}
 */
export const readEnvVars = (configPath, envName) => {
  const { rawConfig } = experimental_readRawConfig({ config: configPath });
  const env = rawConfig.env?.[envName];
  if (!isRecord(env) || !isRecord(env.vars)) return undefined;

  return env.vars;
};
