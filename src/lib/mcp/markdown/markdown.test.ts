import { describe, expect, it } from 'vitest';

import { findRawImageRefs, hasUnsupportedBlocks } from '.';

import type { Blog } from '@payload-types';

const bodyWith = (children: unknown[]): Blog['body'] =>
  ({
    root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 },
  }) as Blog['body'];

describe('findRawImageRefs', () => {
  it('detects raw URL image refs', () => {
    const markdown = '# title\n\n![screenshot](https://example.com/a.png)\n';
    expect(findRawImageRefs(markdown)).toEqual(['![screenshot](https://example.com/a.png)']);
  });

  it('ignores upload placeholders (empty parens)', () => {
    expect(findRawImageRefs('before ![media:12]() after')).toEqual([]);
  });

  it('ignores normal links', () => {
    expect(findRawImageRefs('[link](https://example.com)')).toEqual([]);
  });

  it('detects multiple refs', () => {
    const markdown = '![a](x.png)\n![media:1]()\n![b](y.png)';
    expect(findRawImageRefs(markdown)).toEqual(['![a](x.png)', '![b](y.png)']);
  });
});

describe('hasUnsupportedBlocks', () => {
  it('returns false for plain paragraphs', () => {
    const body = bodyWith([{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'hi' }] }]);
    expect(hasUnsupportedBlocks(body)).toBe(false);
  });

  it('returns true for a top-level block node', () => {
    const body = bodyWith([{ type: 'block', version: 2, fields: { blockType: 'image-row' } }]);
    expect(hasUnsupportedBlocks(body)).toBe(true);
  });

  it('returns true for a nested block node', () => {
    const body = bodyWith([{ type: 'list', version: 1, children: [{ type: 'listitem', version: 1, children: [{ type: 'block', version: 2 }] }] }]);
    expect(hasUnsupportedBlocks(body)).toBe(true);
  });
});
