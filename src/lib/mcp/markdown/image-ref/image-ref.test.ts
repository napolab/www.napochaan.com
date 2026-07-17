import { describe, expect, it } from 'vitest';

import { createMediaFilePlugin, DEFAULT_MEDIA_FILE_PATH_PREFIX } from './plugins/media-file';
import { externalPlugin } from './plugins/external';
import { classifyImageRef, hasNonEmptyParens, isRoundTrippableAlt, parseInlineNodes, serializeImageRef, serializeInlineNodes } from '.';

import type { ImageRef, InlineNode } from '.';

// 個々の family(placeholder / mediaFile / external)の判定ロジックの単体テストは
// ./plugins/*/*.test.ts に移設済み。ここは default registry を通した統合(トークン
// 検出 + family classification の結合)・恒等性・注入経路のテストに絞る。

describe('classifyImageRef (default registry, first-match: placeholder -> mediaFile -> external)', () => {
  it('classifies a placeholder ref', () => {
    expect(classifyImageRef('![media:5](left)')._unsafeUnwrap()).toEqual({ kind: 'placeholder', id: 5, rawID: '5', alt: 'left' });
  });

  it('classifies a media file ref', () => {
    expect(classifyImageRef('![](/api/media/file/a.jpeg)')._unsafeUnwrap()).toEqual({ kind: 'mediaFile', filename: 'a.jpeg', alt: '' });
  });

  it('falls back to external for anything else', () => {
    expect(classifyImageRef('![x](https://example.com/x.png)')._unsafeUnwrap()).toEqual({ kind: 'external', target: 'https://example.com/x.png', alt: 'x' });
  });

  it('falls back to external for a malformed placeholder id (`12x`)', () => {
    expect(classifyImageRef('![media:12x](a)')._unsafeUnwrap()).toEqual({ kind: 'external', target: 'a', alt: 'media:12x' });
  });

  it('falls back to external for empty parens (non-placeholder)', () => {
    expect(classifyImageRef('![x]()')._unsafeUnwrap()).toEqual({ kind: 'external', target: '', alt: 'x' });
  });

  it('never errs (external is the always-ok terminal plugin)', () => {
    expect(classifyImageRef('![](/api/media/file/sub/dir.jpeg)').isOk()).toBe(true);
  });

  it('accepts an injected plugins list, overriding the default registry', () => {
    // externalPlugin だけの registry を注入すると、通常なら placeholder に分類される
    // トークンも external として分類される。
    const result = classifyImageRef('![media:5](left)', [externalPlugin]);
    expect(result._unsafeUnwrap()).toEqual({ kind: 'external', target: 'left', alt: 'media:5' });
  });
});

describe('parseInlineNodes', () => {
  it('returns a single text node for plain text', () => {
    expect(parseInlineNodes('hello world')).toEqual([{ kind: 'text', raw: 'hello world' }]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseInlineNodes('')).toEqual([]);
  });

  it('returns a single image node for a lone ref', () => {
    const nodes = parseInlineNodes('![media:5](left)');
    expect(nodes).toEqual([{ kind: 'image', raw: '![media:5](left)', ref: { kind: 'placeholder', id: 5, rawID: '5', alt: 'left' } }]);
  });

  it('splits text-image-text', () => {
    const nodes = parseInlineNodes('before ![media:1]() after');
    expect(nodes).toEqual([
      { kind: 'text', raw: 'before ' },
      { kind: 'image', raw: '![media:1]()', ref: { kind: 'placeholder', id: 1, rawID: '1', alt: '' } },
      { kind: 'text', raw: ' after' },
    ]);
  });

  it('handles adjacent refs with no text node between them', () => {
    const nodes = parseInlineNodes('![media:1]()![media:2]()');
    expect(nodes).toEqual([
      { kind: 'image', raw: '![media:1]()', ref: { kind: 'placeholder', id: 1, rawID: '1', alt: '' } },
      { kind: 'image', raw: '![media:2]()', ref: { kind: 'placeholder', id: 2, rawID: '2', alt: '' } },
    ]);
  });

  it('classifies a mediaFile ref with title and %20 encoding within a larger text', () => {
    const nodes = parseInlineNodes('see ![x](/api/media/file/IMG%200185.jpeg "title") here');
    expect(nodes).toEqual([
      { kind: 'text', raw: 'see ' },
      { kind: 'image', raw: '![x](/api/media/file/IMG%200185.jpeg "title")', ref: { kind: 'mediaFile', filename: 'IMG 0185.jpeg', alt: 'x' } },
      { kind: 'text', raw: ' here' },
    ]);
  });

  it('accepts an injected plugins list, overriding the default registry', () => {
    const customPlugins = [createMediaFilePlugin('/custom/assets/'), externalPlugin];
    const nodes = parseInlineNodes('![](/custom/assets/a.png)', customPlugins);
    expect(nodes).toEqual([{ kind: 'image', raw: '![](/custom/assets/a.png)', ref: { kind: 'mediaFile', filename: 'a.png', alt: '' } }]);
  });
});

describe('serializeInlineNodes', () => {
  it('joins node raw strings back into the original text', () => {
    const nodes: InlineNode[] = [
      { kind: 'text', raw: 'before ' },
      { kind: 'image', raw: '![media:1]()', ref: { kind: 'placeholder', id: 1, rawID: '1', alt: '' } },
      { kind: 'text', raw: ' after' },
    ];
    expect(serializeInlineNodes(nodes)).toBe('before ![media:1]() after');
  });

  it('returns "" for an empty node list', () => {
    expect(serializeInlineNodes([])).toBe('');
  });
});

describe('serializeImageRef', () => {
  it('serializes a placeholder using rawID (preserving leading zeros)', () => {
    const ref: ImageRef = { kind: 'placeholder', id: 7, rawID: '007', alt: 'new alt' };
    expect(serializeImageRef(ref)).toBe('![media:007](new alt)');
  });

  it('serializes a freshly-constructed placeholder (rawID === `${id}`)', () => {
    const ref: ImageRef = { kind: 'placeholder', id: 5, rawID: '5', alt: '' };
    expect(serializeImageRef(ref)).toBe('![media:5]()');
  });

  it('serializes a mediaFile ref to the canonical /api/media/file/ path, URL-encoding the filename', () => {
    const ref: ImageRef = { kind: 'mediaFile', filename: 'IMG 0185.jpeg', alt: 'cover' };
    expect(serializeImageRef(ref)).toBe('![cover](/api/media/file/IMG%200185.jpeg)');
  });

  it('serializes an external ref as-is', () => {
    const ref: ImageRef = { kind: 'external', target: 'https://example.com/x.png', alt: 'alt' };
    expect(serializeImageRef(ref)).toBe('![alt](https://example.com/x.png)');
  });

  it('uses DEFAULT_MEDIA_FILE_PATH_PREFIX when no mediaFilePathPrefix option is given', () => {
    const ref: ImageRef = { kind: 'mediaFile', filename: 'a.png', alt: '' };
    expect(serializeImageRef(ref)).toBe(`![](${DEFAULT_MEDIA_FILE_PATH_PREFIX}a.png)`);
  });

  it('serializes a mediaFile ref under an injected mediaFilePathPrefix option', () => {
    const ref: ImageRef = { kind: 'mediaFile', filename: 'a.png', alt: '' };
    expect(serializeImageRef(ref, { mediaFilePathPrefix: '/custom/assets/' })).toBe('![](/custom/assets/a.png)');
  });
});

describe('isRoundTrippableAlt', () => {
  it('is true for an alt without a close-paren', () => {
    expect(isRoundTrippableAlt('a normal alt')).toBe(true);
  });

  it('is false for an alt containing ")"', () => {
    expect(isRoundTrippableAlt('alt with )')).toBe(false);
  });

  it('is true for the empty string', () => {
    expect(isRoundTrippableAlt('')).toBe(true);
  });
});

describe('hasNonEmptyParens', () => {
  it('is true when the parens contain a URL', () => {
    expect(hasNonEmptyParens('![x](https://example.com/x.png)')).toBe(true);
  });

  it('is false for empty parens (a non-placeholder ![x]() must not count as raw)', () => {
    expect(hasNonEmptyParens('![x]()')).toBe(false);
  });

  it('is true for parens containing only whitespace (matches the old `[^)]+` semantics)', () => {
    expect(hasNonEmptyParens('![x]( )')).toBe(true);
  });

  it('is false for an empty-target ref whose alt contains parens (alt parens must not count)', () => {
    expect(hasNonEmptyParens('![foo(bar)]()')).toBe(false);
  });

  it('is true for a non-empty target ref whose alt contains parens (target still counts)', () => {
    expect(hasNonEmptyParens('![foo(bar)](x.png)')).toBe(true);
  });
});

// parse -> serialize は恒等(raw を保持しているため)。fence 処理はこのモジュールの
// 責務外(code-fences 側)なので、fixture はすべてフェンスなしの text セグメント想定。
describe('parse -> serialize identity (round trip)', () => {
  const fixtures = [
    'plain text with no images at all',
    '',
    '![media:5](left)',
    '![media:007](x)',
    '![media:12x](a)',
    '![media:]()',
    '![x]()',
    '![](/api/media/file/IMG_0185.jpeg)',
    '![alt text](https://napochaan.com/api/media/file/absolute.png)',
    '![](/api/media/file/IMG%200185.jpeg)',
    '![titled](/api/media/file/titled.gif "caption text")',
    '![external](https://example.com/external.png)',
    '![](/api/media/file/sub/nested.jpeg)',
    '![](/api/media/file/bad%E0%A4%A.jpeg)',
    'before ![media:1]() after',
    '![media:1]()![media:2]()',
    '# post\n\n![](/api/media/file/relative.jpeg)\n![media:3]()\n\nsome trailing text.',
    'multiple ![a](https://x.test/a.png) refs ![b](https://x.test/b.png) in one line',
  ];

  it.each(fixtures)('serializeInlineNodes(parseInlineNodes(%j)) === input', (fixture) => {
    expect(serializeInlineNodes(parseInlineNodes(fixture))).toBe(fixture);
  });
});
