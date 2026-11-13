import { siteNavItems } from '@utils/nav-items';
import { readFileSync } from 'node:fs';

import { getContainerRenderer as reactContainerRenderer } from '@astrojs/react/container-renderer';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { typekitLoaderHtml } from '@themes/typekit';
import { motionBootScriptHtml } from '@utils/motion-cookie';
import { imageBlurScriptHtml } from '@components/image/blur-script';
import { rootStateCarryScriptHTML } from '@utils/root-state-carry';

import { leafElementsOf } from '../test-utils/island-parity';
import SiteLayout from './site-layout.astro';

const ORIGIN = 'http://localhost:8788';

// The layout resolves metadata against the request origin; outside a worker request
// there is no request context, so stub the origin lookup itself.
vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));

const renderLayout = async (pathname: string, slot: string): Promise<string> => {
  const container = await AstroContainer.create({ renderers: await loadRenderers([reactContainerRenderer()]) });
  const request = new Request(`${ORIGIN}${pathname}`);

  return container.renderToString(SiteLayout, { request, props: { metadata: { title: 'about', alternates: { canonical: '/about' } } }, slots: { default: slot } });
};

const count = (html: string, needle: string): number => html.split(needle).length - 1;

describe('site-layout.astro', () => {
  const state = { html: '' };

  beforeAll(async () => {
    state.html = await renderLayout('/about', '<main id="main-content"><p>page body</p></main>');
  });

  it('renders <html lang="ja"> in the boot state with the font variables class', () => {
    expect(state.html).toMatch(/^<html data-astro-transition-scope="[^"]+" lang="ja" class="font-variables wf-loading boot">/);
  });

  it('emits the shell without any heading of its own (pages own the single h1)', () => {
    expect(state.html).not.toMatch(/<h1[\s>]/);
  });

  it('injects each boot script exactly once, inline and without data-astro-rerun', () => {
    for (const script of [typekitLoaderHtml, motionBootScriptHtml, imageBlurScriptHtml, rootStateCarryScriptHTML]) {
      expect(count(state.html, script.__html)).toBe(1);
    }
    expect(state.html).not.toContain('data-astro-rerun');
  });

  it('configures no navigation animation: <html> is a transition scope (transition:animate="none")', () => {
    const scope = state.html.match(/<html[^>]*data-astro-transition-scope="([^"]+)"/)?.[1];
    expect(scope).toBeDefined();
    // Pin the directive's value (any transition:animate adds a scope); same static-read
    // approach as themes/font-vars.test.ts.
    const source = readFileSync(new URL('./site-layout.astro', import.meta.url), 'utf8');
    expect(source.match(/<html[^>]*transition:animate="([^"]+)"/)?.[1]).toBe('none');
    // The `animation: none` CSS for that scope is emitted into the page <head> by the
    // page render, which the Container API does not run for a layout; the built
    // site's zero view-transition animations are verified in the browser (report).
  });

  it('enables the ClientRouter', () => {
    expect(state.html).toContain('<meta name="astro-view-transitions-enabled" content="true"');
  });

  it('writes viewport, theme color and the resolved page metadata', () => {
    expect(state.html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"');
    expect(state.html).toContain('<meta name="theme-color" content="oklch(0.490 0.287 266)"');
    expect(state.html).toContain('<title>about — napochaan</title>');
    expect(state.html).toContain('<link rel="canonical" href="http://localhost:8788/about"');
    expect(state.html).toContain('<meta name="robots" content="noindex, nofollow"');
  });

  it('persists the stateful shell pieces but never the element around the page slot', () => {
    for (const name of ['boot-overlay', 'safe-area-tint', 'typography-band', 'life-frame', 'sys-bar', 'cursor-presence']) {
      expect(count(state.html, `data-astro-transition-persist="${name}"`)).toBe(1);
    }
    const stageOpen = state.html.match(/<div[^>]*data-cursor-surface[^>]*>/)?.[0] ?? '';
    expect(stageOpen).not.toContain('data-astro-transition-persist');
    expect(state.html).toContain('<main id="main-content"><p>page body</p></main>');
  });

  // .claude/rules/astro-islands.md: the shell hydrates no React at all — a page with
  // no islands of its own loads no react-dom.
  it('hydrates no island in the shell', () => {
    expect(state.html).not.toContain('<astro-island');
  });

  // The boot question, the tint's scroll-range sync, the band, the life canvas, the
  // SysBar and the cursor layer ship as framework-free custom elements (no island),
  // each with its registration script bundled once.
  it('renders every interactive shell piece as a custom element', () => {
    const elements = leafElementsOf(state.html).filter((tag) => tag !== 'scramble-text');
    expect(elements).toEqual(['boot-question', 'scroll-range-sync', 'typography-band', 'game-of-life', 'sys-bar', 'cursor-presence']);
    for (const file of ['boot-question.astro', 'safe-area-tint.astro', 'typography-band.astro', 'game-of-life.astro', 'sys-bar.astro', 'cursor-presence.astro']) {
      expect(count(state.html, `${file}?astro&type=script`)).toBe(1);
    }
  });

  // The SysBar and footer labels (both navs + colophon / sitemap) ship as the
  // framework-free <scramble-text> element; its registration script is bundled once,
  // however many render.
  it('renders the SysBar and footer ScrambleText labels as <scramble-text> with one element script', () => {
    expect(count(state.html, '<scramble-text ')).toBe(2 * siteNavItems.length + 2);
    expect(count(state.html, 'scramble-text.astro?astro&type=script')).toBe(1);
  });

  // The persisted SysBar is rendered for the request path: the server marks the
  // active section (the element follows later soft navigations).
  it('marks the page section active in the SysBar from the request pathname', () => {
    const bar = state.html.slice(state.html.indexOf('<sys-bar '), state.html.indexOf('</sys-bar>'));
    expect([...bar.matchAll(/<a data-active="true"[^>]*href="([^"]+)"/g)].map((match) => match[1])).toEqual(['/about']);
  });
});
