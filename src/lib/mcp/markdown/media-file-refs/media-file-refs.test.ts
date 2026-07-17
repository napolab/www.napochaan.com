import { describe, expect, it } from 'vitest';

import { findMediaFileRefs, rewriteMediaFileRefs } from '.';

describe('findMediaFileRefs', () => {
  it('finds a relative /api/media/file/ image ref', () => {
    const refs = findMediaFileRefs('before\n\n![](/api/media/file/IMG_0185.jpeg)\n\nafter');
    expect(refs).toEqual([{ ref: '![](/api/media/file/IMG_0185.jpeg)', filename: 'IMG_0185.jpeg' }]);
  });

  it('finds an absolute URL ref on any host', () => {
    const refs = findMediaFileRefs('![cover](https://napochaan.com/api/media/file/cover.png)');
    expect(refs).toEqual([{ ref: '![cover](https://napochaan.com/api/media/file/cover.png)', filename: 'cover.png' }]);
  });

  it('decodes URL-encoded filenames', () => {
    const refs = findMediaFileRefs('![](/api/media/file/IMG%200185.jpeg)');
    expect(refs).toEqual([{ ref: '![](/api/media/file/IMG%200185.jpeg)', filename: 'IMG 0185.jpeg' }]);
  });

  it('drops a markdown title before parsing the URL', () => {
    const refs = findMediaFileRefs('![x](/api/media/file/a.jpeg "title")');
    expect(refs).toEqual([{ ref: '![x](/api/media/file/a.jpeg "title")', filename: 'a.jpeg' }]);
  });

  it('ignores external image URLs', () => {
    expect(findMediaFileRefs('![x](https://example.com/x.png)')).toEqual([]);
  });

  it('ignores media placeholders and image-row cell captions', () => {
    const fence = ['```image-row', '![media:5](left)', '![media:6]()', '```'].join('\n');
    expect(findMediaFileRefs(fence)).toEqual([]);
  });

  it('ignores nested paths under /api/media/file/', () => {
    expect(findMediaFileRefs('![](/api/media/file/sub/dir.jpeg)')).toEqual([]);
  });

  it('ignores malformed percent-encoding instead of throwing', () => {
    expect(findMediaFileRefs('![](/api/media/file/bad%E0%A4%A.jpeg)')).toEqual([]);
  });
});

describe('rewriteMediaFileRefs', () => {
  it('rewrites a mapped ref to a media placeholder', () => {
    const idByFilename = new Map([['IMG_0185.jpeg', 42]]);
    const result = rewriteMediaFileRefs('a\n\n![alt](/api/media/file/IMG_0185.jpeg)\n\nb', idByFilename);
    expect(result).toBe('a\n\n![media:42]()\n\nb');
  });

  it('rewrites absolute URL refs too', () => {
    const idByFilename = new Map([['cover.png', 7]]);
    expect(rewriteMediaFileRefs('![c](https://stg.napochaan.com/api/media/file/cover.png)', idByFilename)).toBe('![media:7]()');
  });

  it('keeps unmapped and non-media refs intact', () => {
    const idByFilename = new Map([['known.png', 1]]);
    const markdown = '![](/api/media/file/unknown.png) ![x](https://example.com/x.png) ![media:3]()';
    expect(rewriteMediaFileRefs(markdown, idByFilename)).toBe(markdown);
  });
});

// 入出力の全体像を固定する snapshot。全 ref 形状を 1 fixture に集約し、
// 検出対象(サイト内直リンク)と非対象(外部/プレースホルダ/フェンス caption/入れ子 path)の
// 境界が変わったら snapshot 差分で気付けるようにする。
describe('I/O snapshot', () => {
  const fixture = [
    '# post',
    '',
    '![](/api/media/file/relative.jpeg)',
    '![alt text](https://napochaan.com/api/media/file/absolute.png)',
    '![](/api/media/file/enc%20oded.webp)',
    '![titled](/api/media/file/titled.gif "caption text")',
    '![external](https://example.com/external.png)',
    '![media:3]()',
    '![](/api/media/file/sub/nested.jpeg)',
    '',
    '```image-row',
    '![media:5](left caption)',
    '![media:6]()',
    '```',
    '',
    '![](/api/media/file/unmapped.avif)',
  ].join('\n');

  it('findMediaFileRefs extracts exactly the in-site refs', () => {
    expect(findMediaFileRefs(fixture)).toMatchInlineSnapshot(`
      [
        {
          "filename": "relative.jpeg",
          "ref": "![](/api/media/file/relative.jpeg)",
        },
        {
          "filename": "absolute.png",
          "ref": "![alt text](https://napochaan.com/api/media/file/absolute.png)",
        },
        {
          "filename": "enc oded.webp",
          "ref": "![](/api/media/file/enc%20oded.webp)",
        },
        {
          "filename": "titled.gif",
          "ref": "![titled](/api/media/file/titled.gif "caption text")",
        },
        {
          "filename": "unmapped.avif",
          "ref": "![](/api/media/file/unmapped.avif)",
        },
      ]
    `);
  });

  it('rewriteMediaFileRefs rewrites mapped refs and leaves everything else intact', () => {
    const idByFilename = new Map([
      ['relative.jpeg', 10],
      ['absolute.png', 11],
      ['enc oded.webp', 12],
      ['titled.gif', 13],
    ]);
    expect(rewriteMediaFileRefs(fixture, idByFilename)).toMatchInlineSnapshot(`
      "# post

      ![media:10]()
      ![media:11]()
      ![media:12]()
      ![media:13]()
      ![external](https://example.com/external.png)
      ![media:3]()
      ![](/api/media/file/sub/nested.jpeg)

      \`\`\`image-row
      ![media:5](left caption)
      ![media:6]()
      \`\`\`

      ![](/api/media/file/unmapped.avif)"
    `);
  });
});
