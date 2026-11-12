import { describe, expect, it } from 'vitest';

import { nextInternalPlugin } from './index';

describe('nextInternalPlugin', () => {
  it.each(['/_next/image', '/_next/static/chunks/a.js', '/_next/data/x.json'])('keeps the upstream policy of %s', (pathname) => {
    expect(nextInternalPlugin.run(pathname)._unsafeUnwrap()).toEqual({ kind: 'keep' });
  });

  it.each(['/', '/_nextx', '/next/preview', '/blog/_next/image'])('does not match %s', (pathname) => {
    expect(nextInternalPlugin.run(pathname).isErr()).toBe(true);
  });
});
