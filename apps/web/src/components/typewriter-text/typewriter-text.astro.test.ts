import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { islandExportsOf, renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './typewriter-text.astro';
import { TypewriterText } from './index';

describe('typewriter-text.astro', () => {
  // The `.astro` component and the React TypewriterText are a hand-mirrored pair
  // (.claude/rules/cross-module-sync-test.md): the custom element wrapper aside, the
  // markup must equal the React first render so hosts' parity tests hold.
  it.each([
    { text: 'napochaan', phrase: false },
    { text: 'さまざまな「破壊」、承っております。', phrase: false },
    { text: '今日は天気です。', phrase: true },
    { text: 'a < b & "c"', phrase: false },
  ])('renders the React TypewriterText markup (%o)', async ({ text, phrase }) => {
    const html = await renderComponent(Twin, { props: { text, phrase } });
    expect(stripIslands(html)).toBe(renderReactMarkup(TypewriterText, { children: text, phrase }));
  });

  it('wraps the markup in the <typewriter-text> element and hydrates nothing', async () => {
    const html = await renderComponent(Twin, { props: { text: 'napochaan' } });
    expect(html).toMatch(/^<typewriter-text class="[^"]+"><span /);
    expect(html).not.toContain(' phrase');
    expect(islandExportsOf(html)).toEqual([]);
    expect(html).toMatch(/<script type="module"[^>]*>/);
  });

  it('marks phrase so the element swaps in the phrased copy once typed', async () => {
    const html = await renderComponent(Twin, { props: { text: '今日は天気です。', phrase: true } });
    expect(html).toMatch(/^<typewriter-text class="[^"]+" phrase>/);
  });
});
