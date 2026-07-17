import { describe, expect, it } from 'vitest';

import { imageRowMcpSupport } from '.';

const FENCE = ['```image-row', '![media:79](left)', '![media:78]()', '```'].join('\n');

describe('imageRowMcpSupport.blockType', () => {
  it('is "image-row"', () => {
    expect(imageRowMcpSupport.blockType).toBe('image-row');
  });
});

describe('imageRowMcpSupport.stripFences', () => {
  it('removes a well-formed fence entirely', () => {
    expect(imageRowMcpSupport.stripFences(FENCE)).toBe('');
  });

  it('keeps surrounding content while removing the fence', () => {
    const md = `intro\n\n${FENCE}\n\noutro`;
    const stripped = imageRowMcpSupport.stripFences(md);
    expect(stripped).toContain('intro');
    expect(stripped).toContain('outro');
    expect(stripped).not.toContain('media:79');
  });

  it('leaves non-fence content untouched when there is no fence', () => {
    expect(imageRowMcpSupport.stripFences('# hi\n\npara')).toBe('# hi\n\npara');
  });
});

describe('imageRowMcpSupport.validateFences', () => {
  it('accepts a well-formed 2-cell fence', () => {
    expect(imageRowMcpSupport.validateFences(FENCE)).toEqual([]);
  });

  it('rejects a fence with only one cell', () => {
    const bad = ['```image-row', '![media:79](x)', '```'].join('\n');
    const errors = imageRowMcpSupport.validateFences(bad);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('2');
  });

  it('rejects a fence with a non-image line', () => {
    const bad = ['```image-row', '![media:79](x)', 'not an image', '```'].join('\n');
    expect(imageRowMcpSupport.validateFences(bad).length).toBe(1);
  });

  it('accepts a doc with no fences', () => {
    expect(imageRowMcpSupport.validateFences('# hi\n\npara')).toEqual([]);
  });
});

describe('imageRowMcpSupport.extractMediaIDs', () => {
  it('lists media ids from all fences', () => {
    const md = `${FENCE}\n\n${FENCE}`;
    expect(imageRowMcpSupport.extractMediaIDs(md)).toEqual([79, 78, 79, 78]);
  });

  it('returns empty for no fences', () => {
    expect(imageRowMcpSupport.extractMediaIDs('para')).toEqual([]);
  });
});

describe('imageRowMcpSupport.syntaxHelp', () => {
  it('documents the image-row fence syntax for the LLM', () => {
    expect(imageRowMcpSupport.syntaxHelp).toContain('```image-row');
    expect(imageRowMcpSupport.syntaxHelp).toContain('![media:');
  });
});
