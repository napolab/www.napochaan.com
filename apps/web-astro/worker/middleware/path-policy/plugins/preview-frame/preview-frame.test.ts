import { describe, expect, it } from 'vitest';

import { PREVIEW_PATH_PREFIXES } from '../../../../../src/lib/preview/allowed-paths';

import { PREVIEW_ROOTS, previewFramePlugin } from './index';

const CMS_ORIGIN = 'https://cms-stg.napochaan.com';

const run = (pathname: string, options: { cmsOrigin?: string } = { cmsOrigin: CMS_ORIGIN }) => previewFramePlugin.run({ method: 'GET', pathname, headers: new Headers(), ...options });

describe('previewFramePlugin', () => {
  it.each(['/blog/preview/1', '/news/preview/1', '/works/preview/1', '/gallery/preview', '/log/preview', '/next/preview', '/blog/preview'])('lets the cms admin frame %s', (pathname) => {
    expect(run(pathname)._unsafeUnwrap()).toEqual({ kind: 'frame', policy: { frameAncestors: `frame-ancestors 'self' ${CMS_ORIGIN}` } });
  });

  it('falls back to same-origin framing when the cms origin is not configured', () => {
    expect(run('/blog/preview/1', {})._unsafeUnwrap()).toEqual({ kind: 'frame', policy: { frameAncestors: "frame-ancestors 'self'" } });
  });

  it.each(['/', '/blog', '/blog/a', '/blog/previewx', '/admin', '/next/exit-preview', '/gallery'])('leaves %s alone', (pathname) => {
    expect(run(pathname).isErr()).toBe(true);
  });

  it('returns the request as the err value on a miss', () => {
    const input = { method: 'GET', pathname: '/', headers: new Headers(), cmsOrigin: CMS_ORIGIN };

    expect(previewFramePlugin.run(input)._unsafeUnwrapErr()).toBe(input);
  });
});

describe('PREVIEW_ROOTS', () => {
  it('covers every draft route the /next/preview handshake may redirect to, plus the handshake itself', () => {
    const handshakeTargets = PREVIEW_PATH_PREFIXES.map((prefix) => prefix.replace(/\/$/, ''));

    expect([...PREVIEW_ROOTS].sort()).toEqual([...handshakeTargets, '/next/preview'].sort());
  });
});
