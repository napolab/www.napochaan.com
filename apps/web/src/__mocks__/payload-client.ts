// Browser-test stub for `@lib/payload/client`.
//
// The real module calls `getPayload({ config })` at module scope, which drags
// the entire `payload` package (+ `@payload-config` and every collection) into
// the browser bundle. Vite's optimizeDeps then either crashes on Node-only deps
// (e.g. `file-type`'s missing browser export) or, once it gets further, keeps
// discovering payload's transitive deps mid-run and reloads the page — failing
// in-flight test-file imports in a way `retry` cannot recover.
//
// Browser-tested components that read payload data always replace the data
// helper itself (`vi.mock('@lib/payload/<collection>')`), so this client is
// never actually invoked in a browser test. If one ever is, throwing surfaces
// the missing mock instead of failing obscurely. Aliased only in the browser
// vitest project.
export const getPayloadClient = async (): Promise<never> => {
  throw new Error('getPayloadClient is stubbed in browser tests — mock the @lib/payload/<collection> helper instead');
};
