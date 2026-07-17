import { describe, expect, it } from 'vitest';

import { blockSyntaxHelp, extractBlockMediaIDs, findRawImageRefs, hasUnsupportedBlocks, validateBlockFences } from '.';

import type { Blog } from '@payload-types';

const bodyWith = (children: unknown[]): Blog['body'] =>
  ({
    root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 },
  }) as Blog['body'];

const FENCE = ['```image-row', '![media:79](left)', '![media:78]()', '```'].join('\n');

describe('findRawImageRefs (registry-aware)', () => {
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

describe('hasUnsupportedBlocks (registry-driven)', () => {
  it('returns false for a registered block type (image-row)', () => {
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

// フェンス形状(セル数・行内容)ごとの詳細ケースは登録済み plugin 自体の責務なので
// src/blocks/image-row/mcp-support/mcp-support.test.ts で imageRowMcpSupport を
// 単体テストする。ここでは registry 経由の集約(全 plugin を実行して結果を連結する)
// だけを確認する。
describe('validateBlockFences (registry aggregation)', () => {
  it('surfaces a violation reported by a registered plugin', () => {
    const bad = ['```image-row', '![media:79](x)', '```'].join('\n');
    const errors = validateBlockFences(bad);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('2');
  });

  it('returns no violations for a well-formed fence', () => {
    expect(validateBlockFences(FENCE)).toEqual([]);
  });
});

describe('extractBlockMediaIDs (registry aggregation)', () => {
  it('collects media ids across all registered plugins', () => {
    const md = `${FENCE}\n\n${FENCE}`;
    expect(extractBlockMediaIDs(md)).toEqual([79, 78, 79, 78]);
  });

  it('returns empty when nothing matches', () => {
    expect(extractBlockMediaIDs('para')).toEqual([]);
  });
});

describe('blockSyntaxHelp (registry aggregation)', () => {
  it('includes each registered block fence syntax for the LLM', () => {
    expect(blockSyntaxHelp()).toContain('```image-row');
  });
});
