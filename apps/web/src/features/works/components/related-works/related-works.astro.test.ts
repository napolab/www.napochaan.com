import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../../../test-utils/astro-container';
import { renderReactMarkup, stripIslands, stripScrambleHost } from '../../../../test-utils/island-parity';
import Twin from './related-works.astro';
import { RelatedWorks } from './index';

const works = [
  { id: '1', slug: 'with-thumb', title: 'with thumb', type: 'dev', thumbnail: { src: '/api/media/file/a.png', width: 640, height: 480 } },
  { id: '2', slug: 'no-thumb', title: 'no thumb', type: 'video' },
];

describe('related-works.astro', () => {
  it('renders the same markup as the RelatedWorks component', async () => {
    const html = await renderComponent(Twin, { props: { works } });
    expect(stripScrambleHost(stripIslands(html))).toBe(renderReactMarkup(RelatedWorks, { works }));
  });

  it('marks each card link as the scramble group host', async () => {
    const html = await renderComponent(Twin, { props: { works } });
    expect(html.match(/<a [^>]*data-scramble-host/g)).toHaveLength(works.length);
  });

  it('emits no island', async () => {
    expect(await renderComponent(Twin, { props: { works } })).not.toContain('<astro-island');
  });
});
