import { describe, expect, it } from 'vitest';

import { extractImageRowMediaIDs, findRawImageRefs, hasUnsupportedBlocks, validateImageRowFences } from '.';

import type { Blog } from '@payload-types';

const bodyWith = (children: unknown[]): Blog['body'] =>
  ({
    root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 },
  }) as Blog['body'];

const FENCE = ['```image-row', '![media:79](left)', '![media:78]()', '```'].join('\n');

describe('findRawImageRefs (image-row aware)', () => {
  it('excludes image-row cell lines with captions inside a fence', () => {
    expect(findRawImageRefs(FENCE)).toEqual([]);
  });

  it('excludes empty-paren media refs', () => {
    expect(findRawImageRefs('![media:78]()')).toEqual([]);
  });

  it('detects a caption-bearing media ref outside any fence', () => {
    expect(findRawImageRefs('![media:79](left cap)')).toEqual(['![media:79](left cap)']);
  });

  it('still detects raw URL images', () => {
    expect(findRawImageRefs('![shot](https://example.com/a.png)')).toEqual(['![shot](https://example.com/a.png)']);
  });

  it('detects raw URL but not media cell in the same doc', () => {
    const md = `${FENCE}\n\n![x](https://example.com/y.png)`;
    expect(findRawImageRefs(md)).toEqual(['![x](https://example.com/y.png)']);
  });
});

describe('hasUnsupportedBlocks (image-row supported)', () => {
  it('returns false for an image-row block', () => {
    const body = bodyWith([{ type: 'block', version: 2, fields: { blockType: 'image-row' } }]);
    expect(hasUnsupportedBlocks(body)).toBe(false);
  });

  it('returns true for an unknown block type', () => {
    const body = bodyWith([{ type: 'block', version: 2, fields: { blockType: 'some-other-block' } }]);
    expect(hasUnsupportedBlocks(body)).toBe(true);
  });

  it('returns false for plain paragraphs', () => {
    const body = bodyWith([{ type: 'paragraph', version: 1, children: [] }]);
    expect(hasUnsupportedBlocks(body)).toBe(false);
  });

  it('detects a nested unsupported block', () => {
    const body = bodyWith([{ type: 'list', version: 1, children: [{ type: 'block', version: 2, fields: { blockType: 'x' } }] }]);
    expect(hasUnsupportedBlocks(body)).toBe(true);
  });
});

describe('validateImageRowFences', () => {
  it('accepts a well-formed 2-cell fence', () => {
    expect(validateImageRowFences(FENCE)).toEqual([]);
  });

  it('rejects a fence with only one cell', () => {
    const bad = ['```image-row', '![media:79](x)', '```'].join('\n');
    const errors = validateImageRowFences(bad);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('2');
  });

  it('rejects a fence with a non-image line', () => {
    const bad = ['```image-row', '![media:79](x)', 'not an image', '```'].join('\n');
    expect(validateImageRowFences(bad).length).toBe(1);
  });

  it('accepts a doc with no fences', () => {
    expect(validateImageRowFences('# hi\n\npara')).toEqual([]);
  });
});

describe('extractImageRowMediaIDs', () => {
  it('lists media ids from all fences', () => {
    const md = `${FENCE}\n\n${FENCE}`;
    expect(extractImageRowMediaIDs(md)).toEqual([79, 78, 79, 78]);
  });

  it('returns empty for no fences', () => {
    expect(extractImageRowMediaIDs('para')).toEqual([]);
  });
});
