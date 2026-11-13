import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { islandExportsOf, renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './echo-text.astro';
import { EchoText } from './index';

describe('echo-text.astro', () => {
  // The `.astro` component and the React EchoText are a hand-mirrored pair
  // (.claude/rules/cross-module-sync-test.md): the custom element wrapper aside, the
  // markup must stay identical so styles and the hosts' parity tests hold.
  it.each([
    { text: 'napochaan', size: undefined },
    { text: 'napochaan', size: 'compact' as const },
    // Entities in text and in the aria-label (`<` is left out: Astro leaves it raw in an
    // attribute where React writes `&lt;` — the same DOM, different bytes).
    { text: 'a & "c"', size: 'hero' as const },
  ])('renders the React EchoText markup (%o)', async ({ text, size }) => {
    const html = await renderComponent(Twin, { props: { text, size } });
    expect(stripIslands(html)).toBe(renderReactMarkup(EchoText, { children: text, size }));
  });

  it('wraps the markup in the <echo-text> element and hydrates nothing', async () => {
    const html = await renderComponent(Twin, { props: { text: 'napochaan' } });
    expect(html).toMatch(/^<echo-text class="[^"]+"><span data-size="hero" [^>]*role="img" aria-label="napochaan">/);
    expect(islandExportsOf(html)).toEqual([]);
    expect(html).toMatch(/<script type="module"[^>]*>/);
  });
});
