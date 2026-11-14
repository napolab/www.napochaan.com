import { describe, expect, it } from 'vitest';

import { directContacts } from '../../../features/contact/contacts';
import { homeAbout } from '../../../features/home/about-sample';

import { buildJSONLD, serializeJSONLD } from './index';

const ORIGIN = 'https://www.napochaan.com';

const page = {
  origin: ORIGIN,
  url: `${ORIGIN}/blog/a.b`,
  description: 'post description',
  image: `${ORIGIN}/blog/a.b/opengraph-image-fx5gi7`,
};

describe('buildJSONLD — home', () => {
  const graph = buildJSONLD({ type: 'home' }, { origin: ORIGIN, url: ORIGIN, description: 'site description', image: undefined });

  it('emits a WebSite and a Person node linked by @id', () => {
    expect(graph['@context']).toBe('https://schema.org');
    expect(graph).toMatchObject({
      '@graph': [
        { '@type': 'WebSite', '@id': `${ORIGIN}/#website`, url: ORIGIN, name: 'napochaan', description: 'site description', inLanguage: 'ja', publisher: { '@id': `${ORIGIN}/#person` } },
        { '@type': 'Person', '@id': `${ORIGIN}/#person`, name: 'napochaan', url: ORIGIN, image: `${ORIGIN}/icon.png` },
      ],
    });
  });

  it('describes the Person (is-agentic flags a Person without description)', () => {
    const person = '@graph' in graph ? graph['@graph'][1] : undefined;
    expect(person).toMatchObject({ description: `${homeAbout.now}。${homeAbout.likes}` });
  });

  it('takes sameAs from the http(s) direct contacts (no mailto)', () => {
    const person = '@graph' in graph ? graph['@graph'][1] : undefined;
    const expected = directContacts.map((contact) => contact.href).filter((href) => href.startsWith('https://'));
    expect(person).toMatchObject({ sameAs: expected });
    expect(expected.length).toBeGreaterThan(0);
    expect(JSON.stringify(graph)).not.toContain('mailto:');
  });
});

describe('buildJSONLD — blogPosting', () => {
  it('emits a BlogPosting with an inline author Person', () => {
    expect(buildJSONLD({ type: 'blogPosting', headline: 'Post', datePublished: '2026-01-02' }, page)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Post',
      description: 'post description',
      datePublished: '2026-01-02',
      inLanguage: 'ja',
      url: page.url,
      mainEntityOfPage: page.url,
      image: page.image,
      author: { '@type': 'Person', name: 'napochaan', url: ORIGIN },
    });
  });

  it('omits image when the page has none', () => {
    expect(buildJSONLD({ type: 'blogPosting', headline: 'Post', datePublished: '2026-01-02' }, { ...page, image: undefined })).not.toHaveProperty('image');
  });
});

describe('buildJSONLD — creativeWork', () => {
  it('emits a CreativeWork, with dateCreated only when known', () => {
    expect(buildJSONLD({ type: 'creativeWork', name: 'Work', dateCreated: '2024-03-15' }, page)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: 'Work',
      description: 'post description',
      dateCreated: '2024-03-15',
      inLanguage: 'ja',
      url: page.url,
      image: page.image,
      author: { '@type': 'Person', name: 'napochaan', url: ORIGIN },
    });
    expect(buildJSONLD({ type: 'creativeWork', name: 'Work' }, page)).not.toHaveProperty('dateCreated');
  });
});

describe('serializeJSONLD', () => {
  it('escapes < so a CMS title cannot close the <script>, and still round-trips', () => {
    const value = buildJSONLD({ type: 'blogPosting', headline: '</script><script>alert(1)</script>', datePublished: '2026-01-02' }, page);
    const serialized = serializeJSONLD(value);
    expect(serialized).not.toContain('<');
    expect(serialized).toContain('\\u003c/script>');
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
