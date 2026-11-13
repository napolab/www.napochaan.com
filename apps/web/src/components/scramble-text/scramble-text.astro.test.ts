import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './scramble-text.astro';
import { ScrambleText } from './index';

describe('scramble-text.astro', () => {
  // The `.astro` component and the React ScrambleText are a hand-mirrored pair
  // (.claude/rules/cross-module-sync-test.md): the custom element wrapper aside, the
  // markup must stay identical so styles and parity tests of callers hold.
  it.each([
    { astro: { text: 'archive' }, react: { children: 'archive' } },
    { astro: { text: 'archive', clamp: true }, react: { children: 'archive', clamp: true } },
    { astro: { text: 'archive', truncate: true }, react: { children: 'archive', truncate: true } },
    { astro: { text: 'archive', className: 'extra' }, react: { children: 'archive', className: 'extra' } },
    { astro: { text: 'a < b & "c"' }, react: { children: 'a < b & "c"' } },
  ])('renders the React ScrambleText markup (%o)', async ({ astro, react }) => {
    const html = await renderComponent(Twin, { props: astro });
    expect(stripIslands(html)).toBe(renderReactMarkup(ScrambleText, react));
  });

  it('renders the trailing slot after the fill, inside the root', async () => {
    const trailing = '<span aria-hidden="true">↗</span>';
    const html = await renderComponent(Twin, { props: { text: 'archive' }, slots: { trailing } });
    // The React twin receives the same node as `trailing`.
    expect(stripIslands(html)).toBe(stripIslands(renderReactMarkup(ScrambleText, { children: 'archive', trailing: null }).replace(/<\/span>$/, `${trailing}</span>`)));
  });

  it('wraps the markup in the <scramble-text> element, with no whitespace inside', async () => {
    const html = await renderComponent(Twin, { props: { text: 'archive' } });
    expect(html).toMatch(
      /^<scramble-text class="[^"]+"><span [^>]*><span [^>]*>archive<\/span><span aria-hidden="true" [^>]*>archive<\/span><span aria-hidden="true" [^>]*>archive<\/span><\/span><\/scramble-text>/,
    );
    expect(html).not.toContain('trigger=');
    expect(html).not.toContain('<astro-island');
  });

  it('marks trigger="group" so the element resolves the [data-scramble-host] ancestor', async () => {
    const html = await renderComponent(Twin, { props: { text: 'archive', trigger: 'group' } });
    expect(html).toMatch(/^<scramble-text class="[^"]+" trigger="group">/);
  });

  it('bundles the element registration script', async () => {
    const html = await renderComponent(Twin, { props: { text: 'archive' } });
    expect(html).toMatch(/<script type="module"[^>]*>/);
  });
});
