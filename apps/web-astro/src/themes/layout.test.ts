import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { CONTENT_MAX_WIDTH_PX } from './layout';

// site-shell's `maxWidth` is a Panda arbitrary-value literal, which Panda must be
// able to statically extract — it cannot evaluate an imported constant. This test
// is the drift guard the cross-module-sync-test rule asks for when the literal
// can't be derived: it fails if either side changes without the other.
describe('CONTENT_MAX_WIDTH_PX', () => {
  it('matches the maxWidth literal in site-shell styles.css.ts', () => {
    const source = readFileSync(join(import.meta.dirname, '../components/site-shell/styles.css.ts'), 'utf-8');

    expect(source).toContain(`maxWidth: '[${CONTENT_MAX_WIDTH_PX}px]'`);
  });
});
