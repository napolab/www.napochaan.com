import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../../../test-utils/astro-container';
import { renderReactMarkup, stripIslands, stripScrambleHost } from '../../../../test-utils/island-parity';
import Twin from './post-card.astro';
import { PostCard } from './post-card';

const props = { post: { slug: 'first-post', index: '07', title: 'first post', readMin: 8, excerpt: 'an excerpt line' }, formattedDate: '2026.05.10' };

describe('post-card.astro', () => {
  it('renders the same markup as the PostCard component', async () => {
    const html = await renderComponent(Twin, { props });
    expect(stripScrambleHost(stripIslands(html))).toBe(renderReactMarkup(PostCard, props));
  });

  it('marks the card link as the scramble group host', async () => {
    const html = await renderComponent(Twin, { props });
    expect(html).toMatch(/<a [^>]*data-scramble-host/);
  });

  it('emits no island', async () => {
    expect(await renderComponent(Twin, { props })).not.toContain('<astro-island');
  });
});
