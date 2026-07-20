import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical';
import { describe, expect, it, vi } from 'vitest';

import { blockSyntaxHelp, createMarkdownCodec, extractBlockMediaIDs, hasNonRoundTrippableTables, hasUnsupportedBlocks, transformBlockLinkEmbeds, validateBlockFences } from '.';

import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical';
import type { Blog } from '@payload-types';

// codec の「convertMarkdownToLexical → transformBlockLinkEmbeds」の順序だけを
// 検証したいので、Payload の実コンバータ(editorConfig 必須・重い)は受け取った
// markdown を記録した body 形のオブジェクトを返すスタブに差し替える
// (transform は root.children を map するため body 形が必要)。
vi.mock('@payloadcms/richtext-lexical', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@payloadcms/richtext-lexical')>();

  return {
    ...actual,
    convertMarkdownToLexical: vi.fn(({ markdown }: { markdown: string }) => ({
      root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 },
      receivedMarkdown: markdown,
    })),
    convertLexicalToMarkdown: vi.fn(() => ''),
  };
});

const bodyWith = (children: unknown[]): Blog['body'] =>
  ({
    root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 },
  }) as Blog['body'];

const FENCE = ['```image-row', '![media:79](left)', '![media:78]()', '```'].join('\n');

describe('hasUnsupportedBlocks (registry-driven)', () => {
  it('returns false for a registered block type (image-row)', () => {
    const body = bodyWith([{ type: 'block', version: 2, fields: { blockType: 'image-row' } }]);
    expect(hasUnsupportedBlocks(body)).toBe(false);
  });

  it('returns false for a registered block type (Code)', () => {
    const body = bodyWith([{ type: 'block', version: 2, fields: { blockType: 'Code', code: 'const x = 1', language: 'typescript' } }]);
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

  it('surfaces an unsupported code-fence language reported by the code plugin', () => {
    const errors = validateBlockFences('```python\nprint(1)\n```');
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('python');
  });

  it('returns no violations for a supported code fence', () => {
    expect(validateBlockFences('```typescript\nconst x = 1;\n```')).toEqual([]);
  });

  it('returns no violations for the standalone link syntax', () => {
    expect(validateBlockFences('intro\n\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\n\noutro')).toEqual([]);
  });

  it('surfaces the retired ```youtube-embed fence rejection reported by the youtube plugin', () => {
    const errors = validateBlockFences(['```youtube-embed', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '```'].join('\n'));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('廃止');
  });
});

const YT_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const YT_PARAGRAPH = { type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: YT_URL }] };

describe('transformBlockLinkEmbeds (registry provider composition)', () => {
  it('applies the youtube plugin provider: a bare-URL paragraph becomes a youtube-embed block node', () => {
    const body = transformBlockLinkEmbeds(bodyWith([YT_PARAGRAPH]));
    expect(body.root.children).toEqual([
      expect.objectContaining({ type: 'block', fields: expect.objectContaining({ blockType: 'youtube-embed', url: YT_URL, id: expect.stringMatching(/^[0-9a-f]{24}$/) }) }),
    ]);
  });

  it('leaves a tree without qualifying paragraphs unchanged (plugins without a provider are skipped)', () => {
    const paragraph = { type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'plain' }] };
    expect(transformBlockLinkEmbeds(bodyWith([paragraph])).root.children).toEqual([paragraph]);
  });
});

// write path の順序の明示テスト: 呼び出し元(src/lib/mcp/tools)は raw 入力を
// validateBlockFences で検証し、codec.toLexical は Markdown を前処理なしで
// convertMarkdownToLexical に渡してから transformBlockLinkEmbeds を適用する。
describe('createMarkdownCodec.toLexical applies transformBlockLinkEmbeds after conversion', () => {
  it('hands the raw markdown unchanged to convertMarkdownToLexical', () => {
    const codec = createMarkdownCodec<Blog['body']>({} as SanitizedServerEditorConfig);
    const markdown = `intro\n\n${YT_URL}\n\noutro`;
    expect(codec.toLexical(markdown)).toMatchObject({ receivedMarkdown: markdown });
    expect(vi.mocked(convertMarkdownToLexical)).toHaveBeenCalledWith(expect.objectContaining({ markdown }));
  });

  it('transforms the converted tree (a qualifying paragraph returned by the converter becomes a block)', () => {
    vi.mocked(convertMarkdownToLexical).mockReturnValueOnce(bodyWith([YT_PARAGRAPH]) as ReturnType<typeof convertMarkdownToLexical>);
    const codec = createMarkdownCodec<Blog['body']>({} as SanitizedServerEditorConfig);
    expect(codec.toLexical(YT_URL).root.children).toEqual([expect.objectContaining({ type: 'block', fields: expect.objectContaining({ blockType: 'youtube-embed' }) })]);
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
    expect(blockSyntaxHelp()).toContain('```typescript');
  });
});

// フィクスチャ: 1 セル table。cell に colSpan/rowSpan/children/テキストを注入して境界を試す
// (...cell を最後に spread して children も上書き可能にする)。
const tableBody = (cell: Record<string, unknown>, text = 'a'): Blog['body'] =>
  ({
    root: {
      type: 'root',
      children: [
        {
          type: 'table',
          children: [
            {
              type: 'tablerow',
              children: [{ type: 'tablecell', headerState: 0, children: [{ type: 'paragraph', children: [{ type: 'text', text }] }], ...cell }],
            },
          ],
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }) as unknown as Blog['body'];

const paragraphTextBody = (text: string): Blog['body'] =>
  ({
    root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text }] }], direction: null, format: '', indent: 0, version: 1 },
  }) as unknown as Blog['body'];

describe('hasNonRoundTrippableTables', () => {
  it('通常の table は false', () => {
    expect(hasNonRoundTrippableTables(tableBody({}))).toBe(false);
  });

  it('colSpan > 1 の結合セルは true', () => {
    expect(hasNonRoundTrippableTables(tableBody({ colSpan: 2 }))).toBe(true);
  });

  it('rowSpan > 1 の結合セルは true', () => {
    expect(hasNonRoundTrippableTables(tableBody({ rowSpan: 3 }))).toBe(true);
  });

  it('セル内テキストに | を含むと true(export がエスケープしない)', () => {
    expect(hasNonRoundTrippableTables(tableBody({}, 'a | b'))).toBe(true);
  });

  it('セル内に linebreak node があると true(export の \\n が re-import で space に潰れる)', () => {
    const cellChildren = [{ type: 'paragraph', children: [{ type: 'text', text: 'a' }, { type: 'linebreak' }, { type: 'text', text: 'b' }] }];
    expect(hasNonRoundTrippableTables(tableBody({ children: cellChildren }))).toBe(true);
  });

  it('セルの子が複数段落だと true(段落間が export で \\n になり往復不能)', () => {
    const cellChildren = [
      { type: 'paragraph', children: [{ type: 'text', text: 'a' }] },
      { type: 'paragraph', children: [{ type: 'text', text: 'b' }] },
    ];
    expect(hasNonRoundTrippableTables(tableBody({ children: cellChildren }))).toBe(true);
  });

  it('| で開始・終了する段落は true(export で table 行に化ける)', () => {
    expect(hasNonRoundTrippableTables(paragraphTextBody('| これは表ではない |'))).toBe(true);
  });

  it('| を途中に含むだけの段落は false', () => {
    expect(hasNonRoundTrippableTables(paragraphTextBody('a | b'))).toBe(false);
  });

  it('table を含まない本文は false', () => {
    expect(hasNonRoundTrippableTables(paragraphTextBody('普通の本文'))).toBe(false);
  });

  it('linebreak で区切られた行の1つが table 行に見えると true(export で複数行になり、その1行が re-import で table 行になる)', () => {
    const body = {
      root: {
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'text', text: 'x' }, { type: 'linebreak' }, { type: 'text', text: '| a | b |' }] }],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    } as unknown as Blog['body'];

    expect(hasNonRoundTrippableTables(body)).toBe(true);
  });

  it('linebreak があっても各行が table に見えなければ false', () => {
    const body = {
      root: {
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'text', text: 'x' }, { type: 'linebreak' }, { type: 'text', text: 'y' }] }],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    } as unknown as Blog['body'];

    expect(hasNonRoundTrippableTables(body)).toBe(false);
  });

  it('セルの子ブロックが paragraph 以外(heading 等)だと true(export/re-import で構造が変わる)', () => {
    const cellChildren = [{ type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'x' }] }];
    expect(hasNonRoundTrippableTables(tableBody({ children: cellChildren }))).toBe(true);
  });
});
