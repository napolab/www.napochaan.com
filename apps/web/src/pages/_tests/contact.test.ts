import { describe, expect, it, vi } from 'vitest';

import ContactPage from '../contact.astro';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf } from '../../test-utils/island-parity';

const getRequestContext = vi.hoisted(() => vi.fn(() => ({ env: { TURNSTILE_SITE_KEY: 'runtime-site-key' }, ctx: undefined, request: new Request('http://x/') })));

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/request-context', () => ({ getRequestContext }));

const render = async (): Promise<string> => (await renderPage(ContactPage, '/contact')).text();

describe('/contact', () => {
  it('carries the section metadata (title, description, canonical, card image)', async () => {
    const html = await render();
    expect(html).toContain('<title>contact — napochaan</title>');
    expect(html).toContain('<meta name="description" content="お問い合わせ — フォーム、または各種 SNS から直接どうぞ。"');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/contact"');
    expect(html).toContain('og-default.png');
  });

  it('renders one h1 in main#main-content with the message and direct sections', async () => {
    const html = await render();
    expect(html).toMatch(/<main id="main-content" class="[^"]+">/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('aria-label="パンくず"');
    expect(html).toMatch(/<section class="[^"]+">[\s\S]*?message[\s\S]*?<\/section>/);
    expect(html).toMatch(/<aside class="[^"]+">[\s\S]*?direct[\s\S]*?<\/aside>/);
    expect(html).toContain('href="https://github.com/naporin0624"');
    expect(html).toContain('href="https://x.com/naporin24690"');
    expect(html).toContain('href="mailto:contact@napochaan.com"');
  });

  it('server-renders the form fields with submit disabled until Turnstile solves', async () => {
    const html = await render();
    expect(html).toContain('name / お名前');
    expect(html).toContain('email / 返信先');
    expect(html).toContain('message / 本文');
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled/);
  });

  it('hands the form island the Turnstile site key from the runtime env', async () => {
    const html = await render();
    expect(getRequestContext).toHaveBeenCalled();
    expect(html).toContain('runtime-site-key');
  });

  it('hydrates only client leaves inside main, with the form as one island', async () => {
    const islands = mainIslandsOf(await render());
    expect(islands.filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
    expect(islands.filter((name) => name === 'ContactFormIsland')).toHaveLength(1);
    expect(islands).not.toContain('TextFieldIsland');
    expect(islands).not.toContain('ButtonIsland');
  });
});
