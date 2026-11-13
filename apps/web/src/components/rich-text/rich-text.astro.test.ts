import { describe, expect, it } from 'vitest';

import { richTextSample } from '../../features/colophon/demos/rich-text-sample';
import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import { RichText as RichTextReact } from './index';
import RichText from './rich-text.astro';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const text = (value: string) => ({ type: 'text', text: value, format: 0, style: '', mode: 'normal', detail: 0, version: 1 });
const paragraph = (value: string) => ({ type: 'paragraph', children: [text(value)], format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0 });
const heading = (tag: string, value: string) => ({ type: 'heading', tag, children: [text(value)], format: '', indent: 0, version: 1, direction: 'ltr' });
const media = { url: '/m/a.jpg', alt: 'alt a', width: 640, height: 360, mimeType: 'image/jpeg' };
const doc = (children: unknown[]): SerializedEditorState => JSON.parse(JSON.stringify({ root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 } }));

const render = async (children: unknown[]): Promise<string> => renderComponent(RichText, { props: { data: doc(children) } });

// The container's direct children, as opening tags (islands are display: contents).
const topLevelTags = (html: string): string[] => {
  const inner = html.replace(/^<div[^>]*>/, '').replace(/<\/div>$/, '');
  return [...inner.matchAll(/<(h[1-6]|p|figure|div)\b/g)].map((match) => match[1] ?? '');
};

describe('rich-text.astro', () => {
  it('renders paragraphs server-only (no islands)', async () => {
    const html = await render([paragraph('first'), paragraph('second')]);
    expect(html).toContain('first');
    expect(html).toContain('second');
    expect(html).not.toContain('<astro-island');
  });

  it('renders a heading as a direct child with its slug id and a copy-anchor island inside', async () => {
    const html = await render([paragraph('lead'), heading('h2', 'Hello World'), paragraph('after')]);
    expect(html).toMatch(/<h2 id="hello-world" data-level="2" class="[^"]+">\s*<astro-island [^>]*component-export="CopyHashButtonIsland"/);
    expect(html).toContain('この見出しへのリンクをコピー');
    expect(html).toMatch(/Hello World<\/span><\/h2>/);
    expect(html.match(/<astro-island /g)).toHaveLength(1);
    // The island lives inside the heading: the heading itself is a sibling of the paragraphs.
    expect(html.indexOf('<h2')).toBeLessThan(html.indexOf('<astro-island'));
  });

  it('renders an image upload as a static figure whose only island is the Lightbox', async () => {
    const html = await render([{ type: 'upload', value: media, fields: { caption: 'cap' }, relationTo: 'media', version: 3, format: '', id: 'u' }]);
    expect(html).toMatch(/<figure [^>]*data-variant="cover" data-fit="intrinsic"/);
    expect(html).toMatch(/<astro-island [^>]*component-export="LightboxIsland"/);
    expect(html).toMatch(/<img [^>]*alt="alt a"/);
    expect(html).toContain('>cap</figcaption>');
  });

  it('renders an image row as a row of zoomable figures', async () => {
    const html = await render([
      { type: 'block', fields: { id: 'r', blockType: 'image-row', cells: [{ image: media, caption: 'one' }, { image: { ...media, url: '/m/b.jpg' } }] }, format: '', version: 2 },
    ]);
    expect(html.match(/component-export="LightboxIsland"/g)).toHaveLength(2);
    expect(html.match(/<figure /g)).toHaveLength(2);
  });

  it('keeps every block a direct child in document order', async () => {
    const html = await render([heading('h2', 'A'), paragraph('p1'), heading('h3', 'B'), paragraph('p2')]);
    expect(topLevelTags(html).filter((tag) => tag !== 'div')).toEqual(['h2', 'p', 'h3', 'p']);
  });

  // CodeBlock is an async Server Component (Shiki). React's server renderer awaits it
  // inside the static run, so the highlighted tokens land in the page HTML.
  it('renders the async Shiki code block highlighted', async () => {
    const code = { type: 'block', fields: { id: 'c', blockType: 'Code', code: 'const answer: number = 42;', language: 'typescript' }, format: '', version: 2 };
    const html = await render([paragraph('before'), code, paragraph('after')]);
    expect(html).not.toContain('[object Promise]');
    expect(html).toMatch(/<pre class="[^"]+"><code><span class="line">/);
    expect(html).toContain('style="color:var(--code-keyword)">const</span>');
    expect(html).toContain('42');
    expect(html.indexOf('before')).toBeLessThan(html.indexOf('<pre'));
    expect(html.indexOf('<pre')).toBeLessThan(html.indexOf('after'));
  });

  // Every converter the colophon sample exercises (headings, inline formats, links,
  // lists, quote, hr, upload, image-row, youtube) except the async Shiki code block,
  // which renderToStaticMarkup cannot render.
  it('renders the same markup as the React RichText for the colophon sample', async () => {
    const data: SerializedEditorState = { root: { ...richTextSample.root, children: richTextSample.root.children.filter((node) => !JSON.stringify(node).includes('"blockType":"Code"')) } };
    const html = await renderComponent(RichText, { props: { data } });
    expect(stripIslands(html)).toBe(renderReactMarkup(RichTextReact, { data }));
  });
});
