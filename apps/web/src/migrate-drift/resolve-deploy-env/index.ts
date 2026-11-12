// Remote D1 targets. Mirrors the `CLOUDFLARE_ENV` values payload.config.ts binds
// remotely; anything else resolves to the local (miniflare) database.
export type DeployEnv = 'staging' | 'production';

export const resolveDeployEnv = (value: string | undefined): DeployEnv | undefined => {
  switch (value) {
    case 'staging':
    case 'production':
      return value;
    default:
      return undefined;
  }
};
