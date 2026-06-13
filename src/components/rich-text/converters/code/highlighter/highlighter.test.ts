import { describe, expect, it } from 'vitest';

import { getHighlighter, INK_THEME_NAME } from './index';

describe('getHighlighter', () => {
  it('returns a memoized singleton (same instance across calls)', async () => {
    const a = await getHighlighter();
    const b = await getHighlighter();

    expect(a).toBe(b);
  });

  it('loads the five expected languages', async () => {
    const hl = await getHighlighter();
    const loaded = hl.getLoadedLanguages();

    expect(loaded).toContain('typescript');
    expect(loaded).toContain('tsx');
    expect(loaded).toContain('css');
    expect(loaded).toContain('json');
    expect(loaded).toContain('bash');
  });

  it('highlights typescript into a hast tree under the ink theme', async () => {
    const hl = await getHighlighter();
    const hast = hl.codeToHast('const x = 1', { lang: 'typescript', theme: INK_THEME_NAME });

    expect(hast.type).toBe('root');
    expect(JSON.stringify(hast)).toContain('var(--code-');
  });
});
