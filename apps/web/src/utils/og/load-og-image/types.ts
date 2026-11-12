import type { ResultAsync } from 'neverthrow';

export type OgImageContext = {
  absolute: string; // absolute media URL (absent src handled before the loop)
  origin: string; // request origin, for same-origin detection
  env: CloudflareEnv; // for the CMS Service Binding (shape returned by getCloudflareContext().env)
};

export type OgImageRunner = {
  run: (ctx: OgImageContext) => ResultAsync<string | undefined, void>;
};
