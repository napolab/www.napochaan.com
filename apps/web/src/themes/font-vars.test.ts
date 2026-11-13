import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { TITLE_JP_VAR } from './font-vars';
import { tokens } from './tokens';

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

  // Latin follows font-weight like Japanese: no Latin-only heavy face that would
  // paint every Latin glyph at 700 next to 400 Japanese.
  it('has no Latin-only M PLUS 1 face overriding the weight', () => {
    expect(fontsCSS).not.toMatch(/M PLUS 1 En|--font-mplus1-en|m-plus-1-latin-700/);
    expect(tokens.fonts.body.value).toMatch(/^var\(--font-mplus1\),/);
  });

  // Japanese body text is painted by M PLUS 1 at a regular weight (400/500, all
  // slices). A Latin-only import lets Japanese fall through to the system font;
  // the 700 set makes Japanese too heavy.
  it('loads M PLUS 1 400/500 with Japanese slices and no full 700 set', () => {
    expect(fontsCSS).toMatch(/@import '@fontsource\/m-plus-1\/400\.css';/);
    expect(fontsCSS).toMatch(/@import '@fontsource\/m-plus-1\/500\.css';/);
    expect(fontsCSS).not.toMatch(/@fontsource\/m-plus-1\/(latin-\d+|700)\.css/);
  });
});
