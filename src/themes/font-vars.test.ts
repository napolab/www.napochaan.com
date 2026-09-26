import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { TITLE_JP_VAR } from './font-vars';

// fonts.ts calls next/font/google's Zen_Kaku_Gothic_New({ variable: '...' }), and
// next/font requires that `variable` value to be a literal (statically read by
// the Next.js compiler) — it cannot import TITLE_JP_VAR into the call. Worse,
// fonts.ts itself cannot be imported here to compare the two directly: next/font's
// google entry point is an empty stub outside Next's own build pipeline, so
// `import('./fonts')` under plain vitest throws immediately (verified: calling
// M_PLUS_1(...) / Zen_Kaku_Gothic_New(...) outside Next throws
// "... is not a function"). So this test statically reads fonts.ts's source text
// and extracts the literal instead of importing the module — still an automated
// check that fails loudly the moment the two literals drift, per
// .claude/rules/cross-module-sync-test.md's "literal cannot be derived" case.
describe('titleJP CSS variable stays in sync with fonts.ts', () => {
  it('the Zen_Kaku_Gothic_New `variable` literal in fonts.ts matches TITLE_JP_VAR', () => {
    const fontsSource = readFileSync(path.join(__dirname, 'fonts.ts'), 'utf-8');
    const match = fontsSource.match(/variable:\s*'(--font-zen-kaku-gothic-new[\w-]*)'/);
    if (match === null) throw new Error('could not find the Zen Kaku Gothic New `variable` literal in fonts.ts');
    const [, literal] = match;
    expect(literal).toBe(TITLE_JP_VAR);
  });
});
