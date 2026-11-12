import { createFactory } from 'hono/factory';

type HonoEnv = {
  Bindings: Cloudflare.Env;
};

export const factory = createFactory<HonoEnv>();
