import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../../test-utils/astro-container';
import { leafElementsOf, scrambleTextCountOf } from '../../../test-utils/island-parity';
import AboutWhoami from './about-whoami/about-whoami.astro';
import BlogIndex from './blog-index/blog-index.astro';
import GallerySection from './gallery-section/gallery-section.astro';
import Hero from './hero/hero.astro';
import LogSection from './log-section/log-section.astro';
import NewsSection from './news-section/news-section.astro';
import WorksSection from './works-section/works-section.astro';

// Ports of the (site) Server Components' browser tests, plus the island rule: each
// section is static markup whose only islands are its client leaves.
const islandsOf = (html: string): string[] => [...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1] ?? '');

describe('home sections (.astro)', () => {
  it('Hero: wordmark, lead and the three link buttons; hydrates nothing (EchoText / TypewriterText are custom elements, link buttons are static)', async () => {
    const html = await renderComponent(Hero);
    expect(html).toContain('napochaan');
    expect(html).toMatch(/<blockquote [^>]*>[\s\S]*破壊/);
    for (const href of ['/about', '/works', '/contact']) expect(html).toContain(`href="${href}"`);
    expect(islandsOf(html)).toEqual([]);
    expect(leafElementsOf(html)).toEqual(['echo-text', 'typewriter-text']);
  });

  it('AboutWhoami: whoami rows under the "about" heading; nothing hydrates (the more-link label is a <scramble-text> element)', async () => {
    const html = await renderComponent(AboutWhoami, { props: { id: 'about', skills: ['TypeScript', 'React'], now: 'n', likes: 'l', wants: 'w' } });
    expect(html).toMatch(/<section id="about"/);
    expect(html).toContain('TypeScript · React');
    expect(html).toContain('href="/about"');
    expect(islandsOf(html)).toEqual([]);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(1);
    // The element script is still emitted (once) when the only instance sits in a
    // React server component's slot (SectionHeading `more`).
    expect(html.split('scramble-text.astro?astro&type=script').length - 1).toBe(1);
  });

  it('NewsSection: at most five rows; title and more-link labels are <scramble-text> elements', async () => {
    const items = ['1', '2', '3', '4', '5', '6'].map((id) => ({ id, date: `2026.06.0${id}`, category: 'info', title: `news ${id}`, href: `/news/${id}` }));
    const html = await renderComponent(NewsSection, { props: { items } });
    expect(html).toMatch(/<h2[^>]*>news<\/h2>/);
    expect(html).toContain('2026.06.05');
    expect(html).not.toContain('2026.06.06');
    expect(islandsOf(html)).toEqual([]);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(6);
  });

  it('WorksSection: a table row per work with a server-rendered thumbnail', async () => {
    const works = [{ id: '1', slug: 'night', no: '01', title: 'night graphics vol.13', type: 'flyer', year: 2024, thumbnail: { src: '/m/a.jpg', width: 40, height: 40 } }];
    const html = await renderComponent(WorksSection, { props: { id: 'works', works } });
    expect(html).toMatch(/<table role="table"/);
    expect(html).toMatch(/<td role="cell" [^>]*data-label="title"[^>]*><a [^>]*href="\/works\/night"/);
    expect(html).toMatch(/<img [^>]*alt="night graphics vol.13"/);
    expect(islandsOf(html)).toEqual([]);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(2);
  });

  it('LogSection: the timeline renders server-only; the heading labels are <scramble-text> elements', async () => {
    const entries = [{ id: '1', year: 2026, date: '06/14', title: 'next gig @ club', meta: 'Tokyo', upcoming: true }];
    const html = await renderComponent(LogSection, { props: { id: 'log', entries } });
    expect(html).toContain('next gig @ club');
    expect(html).toMatch(/<a [^>]*href="\/log"/);
    expect(islandsOf(html)).toEqual([]);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(2);
  });

  it("GallerySection: the Gallery is SSR'd and hydrated on load", async () => {
    const photos = [{ id: '1', src: '/m/a.jpg', width: 800, height: 600, alt: 'flyer a', caption: 'c' }];
    const html = await renderComponent(GallerySection, { props: { id: 'gallery', photos } });
    expect(html).toMatch(/<img [^>]*alt="flyer a"/);
    expect(islandsOf(html)).toEqual(['GalleryIsland']);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(2);
    expect(html).toMatch(/component-export="GalleryIsland"[^>]*client="load"/);
  });

  it('BlogIndex: index, title link and meta per post', async () => {
    const posts = [{ id: '1', slug: 'quiet', index: '01', title: '静かなインターネットの話', readMin: 5, date: '2026-01-01', excerpt: 'ex' }];
    const html = await renderComponent(BlogIndex, { props: { id: 'blog', posts } });
    expect(html).toMatch(/<a [^>]*href="\/blog\/quiet"/);
    expect(html).toContain('5 min');
    expect(islandsOf(html)).toEqual([]);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(2);
  });
});
