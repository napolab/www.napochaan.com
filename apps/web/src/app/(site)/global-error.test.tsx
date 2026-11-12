import { describe, it } from 'vitest';

// note: global-error.tsx renders its own <html><body> tree (it replaces the
// root layout). Mounting an <html>/<body> inside the vitest browser test
// container nests them under the page's existing <html>/<body>, which the
// browser silently strips/relocates — making any DOM assertion brittle and
// non-representative. The component is intentionally trivial (static markup +
// a reset button), so we skip a brittle render test here rather than assert
// against a mangled tree.
describe('global-error page', () => {
  it.skip('renders its own html document (skipped — html/body nesting in test container)', () => {});
});
