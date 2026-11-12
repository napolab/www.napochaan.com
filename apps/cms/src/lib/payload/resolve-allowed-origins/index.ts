type AllowedOriginsEnv = {
  // Public origin of THIS cms Worker (the `CMS_ORIGIN` wrangler var).
  CMS_ORIGIN: string;
};

// Payload `cors` / `csrf` allowlist. Only the cms itself talks to the admin/API
// from a browser: apps/web reaches the cms over a service binding, so its origin
// (`WEB_ORIGIN`) is deliberately absent. A non-empty `csrf` list makes Payload
// reject cookie auth from any other Origin.
export const resolveAllowedOrigins = (env: AllowedOriginsEnv): string[] => [env.CMS_ORIGIN];
