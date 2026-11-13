import { readFileSync } from 'node:fs';

import { getContainerRenderer as reactContainerRenderer } from '@astrojs/react/container-renderer';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { typekitLoaderHtml } from '@themes/typekit';
import { motionBootScriptHtml } from '@utils/motion-cookie';
import { imageBlurScriptHtml } from '@components/image/blur-script';
import { rootStateCarryScriptHTML } from '@utils/root-state-carry';

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

  it('persists the stateful shell islands but never the element around the page slot', () => {
    for (const name of ['boot-overlay', 'shell-backdrop', 'sys-bar', 'cursor-presence']) {
      expect(count(state.html, `data-astro-transition-persist="${name}"`)).toBe(1);
    }
    const stageOpen = state.html.match(/<div[^>]*data-cursor-surface[^>]*>/)?.[0] ?? '';
    expect(stageOpen).not.toContain('data-astro-transition-persist');
    expect(state.html).toContain('<main id="main-content"><p>page body</p></main>');
  });

  it('feeds the page pathname to the islands', () => {
    expect(state.html).toContain('&quot;pathname&quot;:[0,&quot;/about&quot;]');
  });
});
