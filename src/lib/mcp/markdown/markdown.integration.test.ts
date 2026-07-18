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
    const codec = createMarkdownCodec(await buildEditorConfig());
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
    const codec = createMarkdownCodec(await buildEditorConfig());
    const body = codec.toLexical(['intro', '', URL_HTTPS, '', 'outro'].join('\n'));
    expect(body.root.children).toEqual([
      expect.objectContaining({ type: 'paragraph' }),
      expect.objectContaining({ type: 'block', fields: expect.objectContaining({ blockType: 'youtube-embed', url: URL_HTTPS }) }),
      expect.objectContaining({ type: 'paragraph' }),
    ]);
  });
});
