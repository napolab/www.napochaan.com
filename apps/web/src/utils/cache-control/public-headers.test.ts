import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { PAGE_CACHE_POLICIES } from './index';

// public/_headers is plain text for the Workers Static Assets layer: parse the
// `path` → headers blocks so the rules can be asserted against the policy constants.
const parseHeaders = (source: string): Map<string, Map<string, string>> => {
  const rules = new Map<string, Map<string, string>>();
  const lines = source.split('\n').filter((line) => line.trim() !== '' && !line.trimStart().startsWith('#'));
  const current: { path?: string } = {};
  for (const line of lines) {
    if (!/^\s/.test(line)) {
      current.path = line.trim();
      rules.set(current.path, new Map());
      continue;
    }
    const separator = line.indexOf(':');
    if (current.path === undefined || separator === -1) continue;
    rules.get(current.path)?.set(line.slice(0, separator).trim().toLowerCase(), line.slice(separator + 1).trim());
  }
  return rules;
};

const loadRules = async () => parseHeaders(await readFile(new URL('../../../public/_headers', import.meta.url), 'utf8'));

describe('public/_headers', () => {
  it('keeps hashed /_astro/* assets immutable without an ETag', async () => {
    const rules = await loadRules();
    expect(rules.get('/_astro/*')?.get('cache-control')).toBe('public, max-age=31536000, immutable');
  });

  // Parity with Next: its file-convention OG / icon routes (the hashed URLs already
  // shared on social cards and cached by crawlers) answered the cms page policy.
  it.each(['/opengraph-image-12o0cb.png', '/twitter-image-12o0cb.png', '/icon-12o0cb.png', '/apple-icon-12o0cb.png'])('%s answers the cms policy like the Next route', async (path) => {
    const rules = await loadRules();
    expect(rules.get(path)?.get('cache-control')).toBe(PAGE_CACHE_POLICIES.cms);
  });
});
