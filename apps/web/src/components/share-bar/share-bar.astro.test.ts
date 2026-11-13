import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { islandExportsOf, renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './share-bar.astro';
import { ShareBar } from './index';

const props = { url: 'https://www.napochaan.com/works/1', title: 'タイトル & "引用"' };

describe('share-bar.astro', () => {
  it('renders the React ShareBar markup inside the <share-bar> element, hydrating nothing', async () => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(ShareBar, props));
    expect(islandExportsOf(html)).toEqual([]);
    expect(html).toMatch(/<script type="module"[^>]*>/);
  });

  it('hands the element the share data without a tooltip-making title attribute', async () => {
    const html = await renderComponent(Twin, { props });
    expect(html).toMatch(/^<share-bar class="[^"]+" share-url="https:\/\/www\.napochaan\.com\/works\/1" share-title="タイトル &amp; &quot;引用&quot;">/);
    expect(html).not.toMatch(/^<share-bar [^>]* title=/);
  });
});
