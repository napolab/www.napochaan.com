import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { TITLE_JP_VAR } from './font-vars';

// The font CSS variables are declared in fonts.css (plain CSS, which cannot import
// TITLE_JP_VAR). This test statically reads that source and asserts the declared
// Zen Kaku Gothic New variable matches the constant the `titleJP` token reads,
// per .claude/rules/cross-module-sync-test.md's "literal cannot be derived" case.
const fontsCSS = readFileSync(path.join(import.meta.dirname, 'fonts.css'), 'utf-8');

describe('font CSS variables stay in sync with fonts.css', () => {
  it('fonts.css declares TITLE_JP_VAR for Zen Kaku Gothic New', () => {
    const match = fontsCSS.match(/(--font-zen-kaku-gothic-new[\w-]*):\s*'Zen Kaku Gothic New'/);
    if (match === null) throw new Error('could not find the Zen Kaku Gothic New variable declaration in fonts.css');
    const [, declared] = match;
    expect(declared).toBe(TITLE_JP_VAR);
  });

  it('fonts.css declares the body font variable the tokens read', () => {
    expect(fontsCSS).toMatch(/--font-mplus1:\s*'M PLUS 1';/);
  });

  // Regression: next/font shipped every unicode-range slice (subsets only gated
  // preload), so Japanese was painted by M PLUS 1 700. A Latin-only import makes
  // Japanese fall through to the thinner system font.
  it('loads M PLUS 1 700 with its Japanese slices, not Latin only', () => {
    expect(fontsCSS).toMatch(/@import '@fontsource\/m-plus-1\/700\.css';/);
    expect(fontsCSS).not.toMatch(/@fontsource\/m-plus-1\/latin-/);
  });
});
