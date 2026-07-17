import { describe, expect, it } from 'vitest';

import { fillMediaPlaceholderAlts, findMediaPlaceholders, stripMediaPlaceholderAlts } from '.';

describe('findMediaPlaceholders', () => {
  it('lists placeholders outside fences in order, alt empty/present mixed', () => {
    const markdown = '![media:1]()\ntext\n![media:2](a caption)';
    expect(findMediaPlaceholders(markdown)).toEqual([
      { id: 1, alt: '' },
      { id: 2, alt: 'a caption' },
    ]);
  });

  it('does not list placeholders inside an image-row fence or a md fence', () => {
    const markdown = ['![media:1]()', '```image-row', '![media:5](left)', '```', '```md', '![media:9](example)', '```'].join('\n');
    expect(findMediaPlaceholders(markdown)).toEqual([{ id: 1, alt: '' }]);
  });
});

describe('fillMediaPlaceholderAlts', () => {
  it('fills alt only for mapped ids, overwriting empty or existing parens; unmapped ids stay unchanged', () => {
    const markdown = '![media:1]() ![media:2](old) ![media:3]()';
    const altByID = new Map([
      [1, 'new alt one'],
      [2, 'new alt two'],
    ]);
    expect(fillMediaPlaceholderAlts(markdown, altByID)).toBe('![media:1](new alt one) ![media:2](new alt two) ![media:3]()');
  });

  it('leaves fence content unchanged', () => {
    const markdown = ['```image-row', '![media:1](caption)', '```'].join('\n');
    const altByID = new Map([[1, 'ignored']]);
    expect(fillMediaPlaceholderAlts(markdown, altByID)).toBe(markdown);
  });

  // task-6 (0): map の alt が空文字の場合も「mapped」として扱い、括弧を空にする。
  // (map に無い = 原文のまま、map にあるが空文字 = 括弧を空に、は区別される)
  it('empties the parens for a mapped id whose alt is the empty string, distinct from an unmapped id', () => {
    const markdown = '![media:1](old) ![media:2](old)';
    const altByID = new Map([[1, '']]);
    expect(fillMediaPlaceholderAlts(markdown, altByID)).toBe('![media:1]() ![media:2](old)');
  });

  // task-6 (0): id 部分は `\d+` 必須。桁以外の文字混入や空 id は素通り(マッチしない)。
  it('does not match malformed id notations (`12x` / empty)', () => {
    const malformed = '![media:12x](a) ![media:]()';
    expect(findMediaPlaceholders(malformed)).toEqual([]);
    expect(fillMediaPlaceholderAlts(malformed, new Map([[12, 'x']]))).toBe(malformed);
  });

  // task-6 (0): fill の再構築は raw capture(rawID)を使う — parsed id 経由だと
  // `![media:007]` が `![media:7]` に化けてしまう不整合の regression。
  it('preserves the raw id notation (leading zeros) when filling', () => {
    const markdown = '![media:007](x)';
    const altByID = new Map([[7, 'new alt']]);
    expect(fillMediaPlaceholderAlts(markdown, altByID)).toBe('![media:007](new alt)');
  });
});

describe('stripMediaPlaceholderAlts', () => {
  it('empties all alt-bearing placeholders', () => {
    const markdown = '![media:1](alt one) ![media:2]()';
    expect(stripMediaPlaceholderAlts(markdown)).toBe('![media:1]() ![media:2]()');
  });

  it('leaves fence-internal captions unchanged', () => {
    const markdown = ['![media:1](alt)', '```image-row', '![media:5](left caption)', '```'].join('\n');
    expect(stripMediaPlaceholderAlts(markdown)).toBe(['![media:1]()', '```image-row', '![media:5](left caption)', '```'].join('\n'));
  });
});

describe('fill/strip leave non-placeholder image refs untouched', () => {
  it('does not touch raw URL images', () => {
    const markdown = '![alt](https://example.com/x.png)';
    expect(fillMediaPlaceholderAlts(markdown, new Map([[1, 'x']]))).toBe(markdown);
    expect(stripMediaPlaceholderAlts(markdown)).toBe(markdown);
  });
});

// 入出力の全体像を固定する snapshot。placeholder の alt あり/なし・image-row フェンス・
// md フェンス・生 URL 画像を 1 fixture に集約し、フェンス境界や alt 書き換えの挙動が
// 変わったら snapshot 差分で気付けるようにする。
describe('I/O snapshot', () => {
  const fixture = [
    '# post',
    '',
    '![media:1]()',
    '![media:2](existing alt)',
    '',
    '```image-row',
    '![media:5](left caption)',
    '![media:6]()',
    '```',
    '',
    '```md',
    '![media:9](example text)',
    '```',
    '',
    '![raw](https://example.com/x.png)',
    '![media:99]()',
  ].join('\n');

  it('findMediaPlaceholders lists exactly the fence-outside placeholders', () => {
    expect(findMediaPlaceholders(fixture)).toMatchInlineSnapshot(`
      [
        {
          "alt": "",
          "id": 1,
        },
        {
          "alt": "existing alt",
          "id": 2,
        },
        {
          "alt": "",
          "id": 99,
        },
      ]
    `);
  });

  it('fillMediaPlaceholderAlts fills mapped ids outside fences only', () => {
    const altByID = new Map([
      [1, 'first image'],
      [2, 'second image'],
    ]);
    expect(fillMediaPlaceholderAlts(fixture, altByID)).toMatchInlineSnapshot(`
      "# post

      ![media:1](first image)
      ![media:2](second image)

      \`\`\`image-row
      ![media:5](left caption)
      ![media:6]()
      \`\`\`

      \`\`\`md
      ![media:9](example text)
      \`\`\`

      ![raw](https://example.com/x.png)
      ![media:99]()"
    `);
  });

  it('stripMediaPlaceholderAlts empties every placeholder outside fences', () => {
    expect(stripMediaPlaceholderAlts(fixture)).toMatchInlineSnapshot(`
      "# post

      ![media:1]()
      ![media:2]()

      \`\`\`image-row
      ![media:5](left caption)
      ![media:6]()
      \`\`\`

      \`\`\`md
      ![media:9](example text)
      \`\`\`

      ![raw](https://example.com/x.png)
      ![media:99]()"
    `);
  });
});
