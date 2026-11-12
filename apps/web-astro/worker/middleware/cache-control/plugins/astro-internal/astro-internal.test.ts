import { describe, expect, it } from 'vitest';

import { astroInternalPlugin } from './index';

describe('astroInternalPlugin', () => {
  it.each(['/_astro/client.JLSpUPyv.js', '/_astro/chunks/a.css', '/_next/image', '/_image'])('keeps the upstream policy of %s', (pathname) => {
    expect(astroInternalPlugin.run(pathname)._unsafeUnwrap()).toEqual({ kind: 'keep' });
  });

  it.each(['/', '/_astrox', '/_astro', '/_next/static/chunks/a.js', '/_next/data/x.json', '/_imagex', '/next/preview', '/blog/_astro/a.js', '/_actions/send'])('does not match %s', (pathname) => {
    expect(astroInternalPlugin.run(pathname).isErr()).toBe(true);
  });
});
