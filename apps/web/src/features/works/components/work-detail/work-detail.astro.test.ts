import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../../../test-utils/astro-container';
import WorkDetail from './work-detail.astro';
import { richTextFromParagraphs } from '@utils/sample-rich-text';

const work = {
  title: 'ALICE portrait series',
  type: 'graphic',
  year: 2024,
  thumbnail: { src: '/alice.jpg', width: 800, height: 800 },
  body: richTextFromParagraphs(['アバター ALICE のポートレートシリーズ。']),
};
const url = 'https://napochaan.com/works/7';

const islandsOf = (html: string): string[] => [...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1] ?? '');

describe('work-detail.astro', () => {
  it('renders the cover figure with the title as alt text and the type / year tag', async () => {
    const html = await renderComponent(WorkDetail, { props: { work, url } });
    expect(html).toMatch(/<section class="[^"]+" aria-label="work detail">/);
    expect(html).toMatch(/<img [^>]*alt="ALICE portrait series"/);
    expect(html).toContain('data-variant="cover"');
    expect(html).toContain('graphic / 2024');
  });

  it('renders the type and year meta line', async () => {
    const html = await renderComponent(WorkDetail, { props: { work, url } });
    expect(html).toMatch(/<p class="[^"]+">graphic · 2024<\/p>/);
  });

  it('wraps the server-rendered body in the QuoteShare island', async () => {
    const html = await renderComponent(WorkDetail, { props: { work, url } });
    expect(html).toContain('アバター ALICE の<wbr/>ポートレートシリーズ。');
    expect(islandsOf(html)).toEqual(['QuoteShareIsland']);
  });

  it('omits the body when absent', async () => {
    const html = await renderComponent(WorkDetail, { props: { work: { ...work, body: undefined }, url } });
    expect(html).not.toContain('ポートレートシリーズ');
    expect(islandsOf(html)).toEqual([]);
  });

  it('renders a placeholder block when there is no thumbnail', async () => {
    const html = await renderComponent(WorkDetail, { props: { work: { ...work, thumbnail: undefined }, url } });
    expect(html).not.toContain('<img');
    expect(html).toMatch(/<span class="[^"]+" aria-hidden="true"><\/span>/);
  });
});
