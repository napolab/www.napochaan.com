import { editorConfigFactory } from '@payloadcms/richtext-lexical';
import { describe, expect, it } from 'vitest';

import { blogEditorFeatures } from '../../payload/editor-features';

import { createMarkdownCodec } from '.';

import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical';
import type { Blog } from '@payload-types';

// codec を本物の editorConfig(blogEditorFeatures — mock なし)で往復させる統合テスト。
// SanitizedConfig は BlocksFeature の sanitizeFields(ImageRow の media relationship)と
// link/upload feature の collection フィルタが読む最小限だけをスタブする。
const buildEditorConfig = async (): Promise<SanitizedServerEditorConfig> => {
  const config = { collections: [{ slug: 'media', admin: {}, upload: {}, fields: [] }], blocks: [] } as unknown as Parameters<typeof editorConfigFactory.fromFeatures>[0]['config'];

  return editorConfigFactory.fromFeatures({ config, features: blogEditorFeatures });
};

const URL_HTTPS = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const bodyWithBlock = (fields: Record<string, unknown>): Blog['body'] =>
  ({
    root: {
      type: 'root',
      children: [{ type: 'block', version: 2, format: '', fields }],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }) as Blog['body'];

const blockFieldsOf = (body: Blog['body']): Record<string, unknown> | undefined => {
  const [node] = body.root.children;
  if (node === undefined || node.type !== 'block') return undefined;

  return typeof node.fields === 'object' && node.fields !== null ? (node.fields as Record<string, unknown>) : undefined;
};

// block fields → toMarkdown(公開リンク行) → toLexical(+tree transform) → 同じ block fields。
// id は toLexical 側で新規採番されるため除いて比較し、形式だけ確認する。
describe('markdown codec round-trip for youtube-embed (real editorConfig)', () => {
  const roundTrip = async (fields: Record<string, unknown>) => {
    const codec = createMarkdownCodec<Blog['body']>(await buildEditorConfig());
    const markdown = codec.toMarkdown(bodyWithBlock({ blockType: 'youtube-embed', id: 'seed-id', ...fields }));
    const body = codec.toLexical(markdown);
    const roundTripped = blockFieldsOf(body);
    expect(roundTripped?.id).toMatch(/^[0-9a-f]{24}$/);
    const { id: _id, ...rest } = roundTripped ?? {};

    return { markdown, rest };
  };

  it('round-trips a caption-less embed through the bare URL line', async () => {
    const { markdown, rest } = await roundTrip({ url: URL_HTTPS });
    expect(markdown.trim()).toBe(URL_HTTPS);
    expect(rest).toEqual({ blockType: 'youtube-embed', url: URL_HTTPS });
  });

  it('round-trips a captioned embed through the [caption](url) line', async () => {
    const { markdown, rest } = await roundTrip({ url: URL_HTTPS, caption: 'Rick roll' });
    expect(markdown.trim()).toBe(`[Rick roll](${URL_HTTPS})`);
    expect(rest).toEqual({ blockType: 'youtube-embed', url: URL_HTTPS, caption: 'Rick roll' });
  });

  it('round-trips a caption containing ] (escaped on export, restored by the transform)', async () => {
    const { markdown, rest } = await roundTrip({ url: URL_HTTPS, caption: 'a ] b' });
    expect(markdown.trim()).toBe(`[a \\] b](${URL_HTTPS})`);
    expect(rest).toEqual({ blockType: 'youtube-embed', url: URL_HTTPS, caption: 'a ] b' });
  });

  it('keeps surrounding prose intact when the embed sits between paragraphs', async () => {
    const codec = createMarkdownCodec<Blog['body']>(await buildEditorConfig());
    const body = codec.toLexical(['intro', '', URL_HTTPS, '', 'outro'].join('\n'));
    expect(body.root.children).toEqual([
      expect.objectContaining({ type: 'paragraph' }),
      expect.objectContaining({ type: 'block', fields: expect.objectContaining({ blockType: 'youtube-embed', url: URL_HTTPS }) }),
      expect.objectContaining({ type: 'paragraph' }),
    ]);
  });
});

const HEADER_TABLE = ['| A | B |', '| --- | --- |', '| 1 | 2 |'].join('\n');

type SerializedCellLike = { type: string; headerState: number };
type SerializedRowLike = { type: string; children: SerializedCellLike[] };

const tableRowsOf = (body: Blog['body']): SerializedRowLike[] => {
  const [node] = body.root.children;
  if (node === undefined || node.type !== 'table') return [];

  return (node as unknown as { children: SerializedRowLike[] }).children;
};

// vendor(EXPERIMENTAL_TableFeature)の markdown transformer の挙動を実 editorConfig で
// pin する。ソース精読からの推論でなく実行結果を固定する(markdown-fence-emission ルール)。
describe('markdown codec round-trip for tables (real editorConfig)', () => {
  it('imports a GFM header table into a table node with headerState=1 on the header row', async () => {
    const codec = createMarkdownCodec<Blog['body']>(await buildEditorConfig());
    const rows = tableRowsOf(codec.toLexical(HEADER_TABLE));
    expect(rows).toHaveLength(2);
    expect(rows[0]?.children.map((cell) => cell.headerState)).toEqual([1, 1]);
    expect(rows[1]?.children.map((cell) => cell.headerState)).toEqual([0, 0]);
  });

  it('exports back to the same GFM string (divider restored under the header row)', async () => {
    const codec = createMarkdownCodec<Blog['body']>(await buildEditorConfig());
    expect(codec.toMarkdown(codec.toLexical(HEADER_TABLE)).trim()).toBe(HEADER_TABLE);
  });

  it('round-trips a header-less table without a divider line(非標準 GFM だが往復は安定)', async () => {
    const codec = createMarkdownCodec<Blog['body']>(await buildEditorConfig());
    const md = ['| 1 | 2 |', '| 3 | 4 |'].join('\n');
    expect(codec.toMarkdown(codec.toLexical(md)).trim()).toBe(md);
  });

  it('round-trips inline formatting inside cells', async () => {
    const codec = createMarkdownCodec<Blog['body']>(await buildEditorConfig());
    const md = '| **bold** | plain |';
    expect(codec.toMarkdown(codec.toLexical(md)).trim()).toBe(md);
  });

  // 実挙動: import 側は正規表現で literal "\n" を実改行に変換してから $convertFromMarkdownString
  // に渡すが、単一改行は soft break としてスペースに畳まれ LineBreakNode は作られない。
  // そのため export 側の \n→\\n 変換対象が残らず非可逆(brief の「round-trip する」想定は誤り
  // だったため実行結果に合わせて修正 — markdown-fence-emission ルール: ソース精読でなく実行で pin)。
  it('collapses a literal \\n inside a cell to a space on round-trip (vendor が単一改行を soft break として畳む — 非可逆)', async () => {
    const codec = createMarkdownCodec<Blog['body']>(await buildEditorConfig());
    const md = '| a\\nb | c |';
    expect(codec.toMarkdown(codec.toLexical(md)).trim()).toBe('| a b | c |');
  });

  it('連続する同列数 table の import 挙動を snapshot で pin する(vendor はマージすることがある)', async () => {
    const codec = createMarkdownCodec<Blog['body']>(await buildEditorConfig());
    const body = codec.toLexical(['| a | b |', '', '| c | d |'].join('\n'));
    expect(body.root.children.map((node) => node.type)).toMatchInlineSnapshot(`
      [
        "table",
        "table",
      ]
    `);
  });

  it('table と Code fence が同一本文で共存する', async () => {
    const codec = createMarkdownCodec<Blog['body']>(await buildEditorConfig());
    const md = ['| A |', '| --- |', '| 1 |', '', '```typescript', 'const x = 1;', '```'].join('\n');
    const body = codec.toLexical(md);
    expect(body.root.children.map((node) => node.type)).toMatchInlineSnapshot(`
      [
        "table",
        "block",
      ]
    `);
  });
});
