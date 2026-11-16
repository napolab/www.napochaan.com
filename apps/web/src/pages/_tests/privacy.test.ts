import { describe, expect, it, vi } from 'vitest';

import PrivacyPage from '../privacy.astro';
import { privacy } from '../../features/privacy/content';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf } from '../../test-utils/island-parity';

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));

const render = async (): Promise<string> => (await renderPage(PrivacyPage, '/privacy')).text();

const mainOf = (html: string): string => html.slice(html.indexOf('<main id="main-content"'), html.indexOf('</main>'));

// Visible text of the main region: tags, scripts and styles dropped, whitespace collapsed.
const textOf = (html: string): string =>
  html
    .replace(/<(script|style|template)[\s\S]*?<\/\1>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '');

describe('/privacy', () => {
  it('carries the section metadata (title, description, canonical, markdown alternate)', async () => {
    const html = await render();
    expect(html).toContain('<title>privacy — napochaan</title>');
    expect(html).toContain('<meta name="description" content="このサイトで受け取る情報と、その使いみち。"');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/privacy"');
    expect(html).toMatch(/<link rel="alternate" type="text\/markdown"[^>]*href="http:\/\/localhost:8788\/privacy\.md"/);
  });

  it('advertises the markdown twin in the Link header', async () => {
    const response = await renderPage(PrivacyPage, '/privacy');
    expect(response.headers.get('link')).toBe(
      '</privacy.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="sitemap"; type="application/xml", </.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/ai-catalog+json"',
    );
  });

  it('renders the page header h1 as the only h1 inside main#main-content', async () => {
    const html = await render();
    expect(html).toMatch(/<main id="main-content" class="[^"]+">/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('aria-label="パンくず"');
    expect(html).toContain(privacy.kicker);
  });

  it('renders the five numbered sections, each with an h2 and its question', async () => {
    const main = mainOf(await render());
    expect(main.match(/<section[\s>]/g)).toHaveLength(privacy.sections.length);
    for (const section of privacy.sections) {
      expect(main).toMatch(new RegExp(`<h2[^>]*>${section.heading}</h2>`));
      expect(main).toContain(section.question);
    }
  });

  it('renders the services as a semantic table with a caption and scoped headers', async () => {
    const main = mainOf(await render());
    expect(main).toMatch(/<table[^>]*>\s*<caption[^>]*>サイトを動かすために、次のサービスを使っています。<\/caption>/);
    expect(main.match(/<th[^>]*scope="col"/g)).toHaveLength(3);
    expect(main.match(/<th[^>]*scope="row"/g)).toHaveLength(4);
    for (const service of ['Cloudflare Turnstile', 'Resend', 'Discord', 'Cloudflare Web Analytics']) {
      expect(main).toContain(`>${service}</th>`);
    }
  });

  it('lists what the contact form collects', async () => {
    const main = mainOf(await render());
    expect(main).toMatch(/<ul[^>]*>[\s\S]*お名前[\s\S]*メールアドレス[\s\S]*本文[\s\S]*<\/ul>/);
  });

  it('links the contact address as a mailto link', async () => {
    const main = mainOf(await render());
    expect(main).toMatch(/<a [^>]*href="mailto:contact@napochaan\.com"[^>]*>contact@napochaan\.com<\/a>/);
  });

  it('dates the policy with a machine-readable <time>', async () => {
    const main = mainOf(await render());
    expect(main).toContain('<time datetime="2026-11-16">2026-11-16</time>');
  });

  it('carries at least 500 characters of content', async () => {
    expect(textOf(mainOf(await render())).length).toBeGreaterThanOrEqual(500);
  });

  it('hydrates only client leaves inside main', async () => {
    const html = await render();
    expect(mainIslandsOf(html).filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
  });
});
