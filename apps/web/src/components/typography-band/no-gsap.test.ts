import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// The band sits in the site shell on every page. It drives its drift / velocity boost /
// grid snap with plain rAF + scroll listeners, so a desktop page that never hovers a
// ScrambleText (and has no EchoText) never fetches the gsap core. Statically assert no
// band source reaches gsap — directly or through the @utils/gsap loader.
const sources = readdirSync(import.meta.dirname)
  .filter((file) => /\.(ts|tsx|astro)$/.test(file) && !/\.test\.tsx?$/.test(file))
  .map((file) => ({ file, source: readFileSync(path.join(import.meta.dirname, file), 'utf-8') }));

describe('typography-band sources', () => {
  it('include the drift / snap driver', () => {
    expect(sources.map(({ file }) => file)).toContain('bind-band.ts');
  });

  it.each(sources)('$file imports neither gsap nor the gsap loader', ({ source }) => {
    expect(source).not.toMatch(/from\s+['"](gsap|@utils\/gsap)[^'"]*['"]/);
    expect(source).not.toMatch(/import\(\s*['"](gsap|@utils\/gsap)/);
  });
});
