// Mirrors the site content column's max width, hardcoded as a Panda arbitrary
// value literal (`maxWidth: '[1180px]'`) in src/components/site-shell/styles.css.ts.
// That literal cannot import this constant: Panda extracts `css()` calls
// statically at build time and cannot evaluate an imported value, so the two
// must stay in sync by hand. src/themes/layout.test.ts asserts the site-shell
// source still contains the matching literal.
export const CONTENT_MAX_WIDTH_PX = 1180;
