// Browser-test stand-in for `@payloadcms/ui` (aliased in vitest.config.ts).
// Only the exports used by packages/payload-cloudflare-access client components.
export const Logout = () => <span data-testid="payload-logout" />;

export const LogOutIcon = () => <svg data-testid="payload-logout-icon" aria-hidden="true" />;
