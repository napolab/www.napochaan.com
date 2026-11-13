/// <reference types="astro/client" />

// tsgo has no Astro language-service plugin, so `.astro` imports from `.ts` (the
// Container API tests) need an ambient declaration. Frontmatter itself is not
// type-checked by tsgo — keep logic in `.ts` modules and `.astro` files thin.
declare module '*.astro' {
  const Component: import('astro/runtime/server/index.js').AstroComponentFactory;
  export default Component;
}
