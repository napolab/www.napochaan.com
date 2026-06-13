import type { ResultAsync } from 'neverthrow';

export type OgImageContext = {
  absolute: string; // absolute media URL (absent src handled before the loop)
  origin: string; // request origin, for same-origin detection
  isDev: boolean; // NODE_ENV === 'development'
  env: CloudflareEnv; // for WORKER_SELF_REFERENCE (shape returned by getCloudflareContext().env)
};

export type OgImageRunner = {
  run: (ctx: OgImageContext) => ResultAsync<string | undefined, void>;
};
