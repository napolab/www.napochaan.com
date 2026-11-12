import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveSizes } from './sizes';

describe('resolveSizes', () => {
  it('caps at the full content column for the default fill fit', () => {
    expect(resolveSizes('fill', 1600, undefined)).toBe('(min-width: 1180px) 1180px, 100vw');
  });

  it('caps at the source width for an intrinsic fit narrower than the 85% column cap', () => {
    expect(resolveSizes('intrinsic', 400, undefined)).toBe('(min-width: 1180px) 400px, min(400px, 85vw)');
  });

  // The intrinsic frame renders at `min(var(--figure-width), 85%)` of the content
  // column (styles.css.ts), so a source wider than 1180 * 0.85 ≈ 1003px never
  // actually renders at its own width — the cap must switch to the column ratio.
  it('caps at the 85% column cap for an intrinsic fit wider than the cap', () => {
    expect(resolveSizes('intrinsic', 2400, undefined)).toBe('(min-width: 1180px) 1003px, min(2400px, 85vw)');
  });

  it('lets a caller override sizes regardless of fit', () => {
    expect(resolveSizes('intrinsic', 400, '50vw')).toBe('50vw');
    expect(resolveSizes('fill', 1600, '50vw')).toBe('50vw');
  });

  // Pins the 85% literal in styles.css.ts against the ratio resolveSizes derives
  // its cap from — mirrors src/themes/layout.test.ts's CONTENT_MAX_WIDTH_PX pin.
  // Catches either side drifting without the other (cross-module-sync-test rule).
  it('pins the 85% intrinsic-column ratio against the styles.css.ts source', () => {
    const source = readFileSync(join(import.meta.dirname, './styles.css.ts'), 'utf-8');
    expect(source).toContain('85%');
  });
});
