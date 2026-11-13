import { describe, expect, it, vi } from 'vitest';

import * as exitPreview from '../next/exit-preview';
import * as preview from '../next/preview';
import { clearDraftCookieHeader, draftCookieHeader } from '../../lib/draft-mode';
import { renderEndpoint } from '../../test-utils/astro-container';

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

const env = vi.hoisted(() => ({ current: { PREVIEW_SECRET: 'right', CMS_ORIGIN: 'https://cms.napochaan.com' } as Partial<Cloudflare.Env> }));

vi.mock('@lib/request-context', () => ({ getRequestContext: () => ({ env: env.current }) }));

const previewEndpoint = preview as unknown as AstroComponentFactory;
const exitEndpoint = exitPreview as unknown as AstroComponentFactory;

const callPreview = async (query: string) => renderEndpoint(previewEndpoint, `/next/preview?${query}`);

// Port of apps/web/src/app/next/preview/route.test.ts: Next draft mode becomes the
// HMAC draft cookie (src/lib/draft-mode).
describe('/next/preview', () => {
  it('rejects a wrong previewSecret with 403 and sets no cookie', async () => {
    const res = await callPreview('previewSecret=wrong&path=/blog/preview/1');
    expect(res.status).toBe(403);
    expect(await res.text()).toBe('You are not allowed to preview this page');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('rejects a missing previewSecret with 403', async () => {
    expect((await callPreview('path=/blog/preview/1')).status).toBe(403);
  });

  it.each([{ PREVIEW_SECRET: '' }, {}])('rejects an empty submitted secret when the configured secret is unset (%o)', async (configured) => {
    env.current = configured;
    const res = await callPreview('previewSecret=&path=/blog/preview/1');
    env.current = { PREVIEW_SECRET: 'right', CMS_ORIGIN: 'https://cms.napochaan.com' };
    expect(res.status).toBe(403);
  });

  it('rejects a non-preview path with 400 even with the right secret', async () => {
    const res = await callPreview('previewSecret=right&path=//evil.example');
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('This endpoint can only be used for preview routes');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('sets the draft cookie and 307-redirects to the preview path with the right secret', async () => {
    const res = await callPreview('previewSecret=right&path=/blog/preview/1');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/blog/preview/1');
    expect(res.headers.get('set-cookie')).toBe(await draftCookieHeader('right'));
  });
});

describe('/next/exit-preview', () => {
  it('clears the draft cookie and lands on / without a redirect param', async () => {
    const res = await renderEndpoint(exitEndpoint, '/next/exit-preview');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/');
    expect(res.headers.get('set-cookie')).toBe(clearDraftCookieHeader());
  });

  it('chains to the cms origin (cms logout)', async () => {
    const res = await renderEndpoint(exitEndpoint, '/next/exit-preview?redirect=https://cms.napochaan.com/cdn-cgi/access/logout');
    expect(res.headers.get('location')).toBe('https://cms.napochaan.com/cdn-cgi/access/logout');
  });

  it('falls back to / for a foreign origin', async () => {
    const res = await renderEndpoint(exitEndpoint, '/next/exit-preview?redirect=https://evil.example/');
    expect(res.headers.get('location')).toBe('/');
  });
});
