import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { TITLE_JP_VAR } from './font-vars';

// fonts-title.ts calls next/font/google's Zen_Kaku_Gothic_New({ variable: '...' }),
// and next/font requires that `variable` value to be a literal (statically read
// by the Next.js compiler) — it cannot import TITLE_JP_VAR into the call. Worse,
// fonts-title.ts itself cannot be imported here to compare the two directly:
// next/font's google entry point is an empty stub outside Next's own build
// pipeline, so `import('./fonts-title')` under plain vitest throws immediately
// (verified: calling M_PLUS_1(...) / Zen_Kaku_Gothic_New(...) outside Next
// throws "... is not a function"). So this test statically reads
// fonts-title.ts's source text and extracts the literal instead of importing
// the module — still an automated check that fails loudly the moment the two
// literals drift, per .claude/rules/cross-module-sync-test.md's "literal
// cannot be derived" case.
describe('titleJP CSS variable stays in sync with fonts-title.ts', () => {
  it('the Zen_Kaku_Gothic_New `variable` literal in fonts-title.ts matches TITLE_JP_VAR', () => {
    const fontsSource = readFileSync(path.join(__dirname, 'fonts-title.ts'), 'utf-8');
    const match = fontsSource.match(/variable:\s*'(--font-zen-kaku-gothic-new[\w-]*)'/);
    if (match === null) throw new Error('could not find the Zen Kaku Gothic New `variable` literal in fonts-title.ts');
    const [, literal] = match;
    expect(literal).toBe(TITLE_JP_VAR);
  });
});
