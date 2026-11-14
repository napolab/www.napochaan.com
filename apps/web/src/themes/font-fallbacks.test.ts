import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { tokens } from './tokens';

// The Typekit faces (digibop, config-mono-vf) load async, so until they resolve the
// token stacks paint a local fallback. Each stack names a metric-matched
// "<family> Fallback" @font-face declared in global.css (render-blocking, local()
// sources only), so the swap does not reflow the page (CLS). global.css is plain CSS
// and cannot import the token, so this test reads its source and asserts both sides.
const globalCSS = readFileSync(path.join(import.meta.dirname, 'global.css'), 'utf-8');

const fontFaceBlocks = (family: string): string[] => [...globalCSS.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body = '']) => body).filter((body) => body.includes(`font-family: '${family}'`));

const localSources = (block: string): string[] => [...block.matchAll(/local\('([^']+)'\)/g)].map(([, name = '']) => name);

describe('metric-matched fallbacks for the async Typekit faces', () => {
  it('puts each fallback right after its web font in the token stack', () => {
    expect(tokens.fonts.display.value).toMatch(/^"digibop", "digibop Fallback",/);
    expect(tokens.fonts.mono.value).toMatch(/^"config-mono-vf", "config-mono-vf Fallback",/);
  });

  // local('Courier New') alone misses Linux / ChromeOS (fontconfig aliases do not
  // satisfy local()), where the band fell back to ui-monospace and shifted on swap.
  it('backs the mono fallback with Courier New and its metric-compatible clones', () => {
    const [block] = fontFaceBlocks('config-mono-vf Fallback');
    if (block === undefined) throw new Error('config-mono-vf Fallback @font-face is missing from global.css');
    expect(localSources(block)).toEqual(expect.arrayContaining(['Courier New', 'Liberation Mono', 'Cousine']));
  });

  // The hero wordmark is italic digibop, so both styles need a face: an italic
  // request would otherwise skip the family and land on system-ui.
  it('declares a normal and an italic digibop fallback on Arial and its clones', () => {
    const blocks = fontFaceBlocks('digibop Fallback');
    const italic = blocks.filter((block) => /font-style:\s*italic/.test(block));
    const normal = blocks.filter((block) => !/font-style:\s*italic/.test(block));
    expect(normal).toHaveLength(1);
    expect(italic).toHaveLength(1);
    expect(localSources(normal[0] ?? '')).toEqual(expect.arrayContaining(['Arial', 'Liberation Sans', 'Arimo']));
    expect(localSources(italic[0] ?? '')).toEqual(expect.arrayContaining(['Arial Italic', 'Liberation Sans Italic', 'Arimo Italic']));
    for (const block of blocks) {
      expect(block).toMatch(/size-adjust:\s*102%/);
      expect(block).toMatch(/ascent-override:/);
      expect(block).toMatch(/descent-override:/);
      expect(block).toMatch(/line-gap-override:\s*0%/);
    }
  });

  it('keeps the fallbacks local-only (global.css is render-blocking)', () => {
    for (const block of [...fontFaceBlocks('digibop Fallback'), ...fontFaceBlocks('config-mono-vf Fallback')]) {
      expect(block).not.toMatch(/url\(/);
    }
  });
});
