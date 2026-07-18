import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { err, ok } from 'neverthrow';
import { describe, expect, it } from 'vitest';

import { createLinkEmbedTransform } from '@utils/lexical/link-embed';
import { blogEditorFeatures } from '@lib/payload/editor-features';

import { formatYouTubeEmbedMarkdown } from '../markdown-format';

import { youtubeEmbedProvider } from '.';

import type { StandaloneLink } from '@utils/lexical/link-embed';
import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical';
import type { Blog } from '@payload-types';

const ID = 'dQw4w9WgXcQ';
const URL_HTTPS = `https://www.youtube.com/watch?v=${ID}`;

const linkOf = (url: string, caption = ''): StandaloneLink => ({ url, caption });

// provider 単体の契約(prefix-match-processor): 自サービスの URL なら ok(block fields)、
// そうでなければ err(link) — null/boolean/throw は返さない。
describe('youtubeEmbedProvider.run: matching URLs', () => {
  it('returns youtube-embed fields for a watch?v= URL, omitting the caption key when empty', () => {
    expect(youtubeEmbedProvider.run(linkOf(URL_HTTPS))).toEqual(ok({ blockType: 'youtube-embed', url: URL_HTTPS }));
  });

  it('includes the caption when present', () => {
    expect(youtubeEmbedProvider.run(linkOf(URL_HTTPS, 'Rick roll'))).toEqual(ok({ blockType: 'youtube-embed', url: URL_HTTPS, caption: 'Rick roll' }));
  });

  it('accepts the youtu.be short link and /embed/ path forms, storing the url as written (no normalization)', () => {
    const short = `https://youtu.be/${ID}`;
    const embed = `https://www.youtube.com/embed/${ID}`;
    expect(youtubeEmbedProvider.run(linkOf(short))).toEqual(ok({ blockType: 'youtube-embed', url: short }));
    expect(youtubeEmbedProvider.run(linkOf(embed))).toEqual(ok({ blockType: 'youtube-embed', url: embed }));
  });

  it('never emits an id field (the generic layer assigns ids)', () => {
    const result = youtubeEmbedProvider.run(linkOf(URL_HTTPS));
    expect(result.isOk() ? result.value : undefined).not.toHaveProperty('id');
  });
});

describe('youtubeEmbedProvider.run: non-matching URLs return err(link) untouched', () => {
  const rejects = (link: StandaloneLink) => {
    expect(youtubeEmbedProvider.run(link)).toEqual(err(link));
  };

  it('rejects a non-YouTube video URL', () => {
    rejects(linkOf('https://vimeo.com/1234', 'a video'));
  });

  it('rejects a /shorts/ URL (parseYouTubeVideoID cannot parse it)', () => {
    rejects(linkOf(`https://www.youtube.com/shorts/${ID}`));
  });

  it('rejects an http (non-https) URL', () => {
    rejects(linkOf(`http://www.youtube.com/watch?v=${ID}`));
  });

  it('rejects a URL with trailing prose (the whole candidate must be the URL)', () => {
    rejects(linkOf(`${URL_HTTPS} を見て`));
  });

  it('rejects plain prose and the empty string', () => {
    rejects(linkOf('こんにちは'));
    rejects(linkOf(''));
  });
});

// ここから下は provider を実 Markdown import + 汎用 transform に組み込んだ統合確認。
// 汎用層(tree walk・qualifying 判定)の網羅は
// src/utils/lexical/link-embed/link-embed.test.ts の責務。
const buildEditorConfig = async (): Promise<SanitizedServerEditorConfig> => {
  const config = { collections: [{ slug: 'media', admin: {}, upload: {}, fields: [] }], blocks: [] } as unknown as Parameters<typeof editorConfigFactory.fromFeatures>[0]['config'];

  return editorConfigFactory.fromFeatures({ config, features: blogEditorFeatures });
};

const toLexical = async (markdown: string): Promise<Blog['body']> => {
  const editorConfig = await buildEditorConfig();

  return convertMarkdownToLexical({ editorConfig, markdown }) as Blog['body'];
};

const transform = createLinkEmbedTransform([youtubeEmbedProvider], () => 'test-id');

const blockOf = (url: string, caption?: string) => ({
  type: 'block',
  version: 2,
  format: '',
  fields: caption === undefined ? { blockType: 'youtube-embed', url, id: 'test-id' } : { blockType: 'youtube-embed', url, caption, id: 'test-id' },
});

describe('youtube provider through the link-embed transform: caption escape round-trip', () => {
  // export(formatYouTubeEmbedMarkdown)→ 実 Markdown import → transform で
  // block fields が無損失で往復することを固定する。
  const roundTrip = async (caption: string) => {
    const markdown = formatYouTubeEmbedMarkdown(URL_HTTPS, caption);
    const body = transform(await toLexical(markdown));

    return body.root.children;
  };

  it('round-trips a plain caption', async () => {
    expect(await roundTrip('Rick roll')).toEqual([blockOf(URL_HTTPS, 'Rick roll')]);
  });

  it('round-trips a caption containing ] (exported as \\], restored by the transform)', async () => {
    expect(await roundTrip('a ] b')).toEqual([blockOf(URL_HTTPS, 'a ] b')]);
  });

  it('round-trips a caption containing parentheses', async () => {
    expect(await roundTrip('live (2024)')).toEqual([blockOf(URL_HTTPS, 'live (2024)')]);
  });

  it('also restores a caption written with a raw unescaped ] (lexical link style)', async () => {
    const body = transform(await toLexical(`[a ] b](${URL_HTTPS})`));
    expect(body.root.children).toEqual([blockOf(URL_HTTPS, 'a ] b')]);
  });

  // 既知の限界: lexical の link importRegExp はリンクテキストに [ を一切許さない
  // ([^[]+)ため、[ を含む caption は \[ にエスケープしても素のままでも単一 link node に
  // ならず、埋め込みには戻らない(通常の段落のまま残る)。これは lexical の link node
  // 全般の制約(export も無エスケープ)で、この block 固有の後退ではない。
  it('a caption containing [ cannot round-trip: the paragraph stays untouched (known lexical limitation)', async () => {
    const markdown = formatYouTubeEmbedMarkdown(URL_HTTPS, 'a [b] c');
    const body = transform(await toLexical(markdown));
    expect(body.root.children).toEqual([expect.objectContaining({ type: 'paragraph' })]);
  });
});

describe('youtube provider through the link-embed transform: block node shape parity with the old fence import', () => {
  // 旧 youtube-embed 内部フェンス経路($importMultiline → $createServerBlockNode)が
  // 生成していた node 形状の実測値:
  //   { type: 'block', version: 2, format: '', fields: { blockType, url, (caption,) id } }
  it('emits exactly the old fence-import node shape', async () => {
    const body = transform(await toLexical(`[Rick roll](${URL_HTTPS})`));
    expect(body.root.children[0]).toEqual({
      type: 'block',
      version: 2,
      format: '',
      fields: { blockType: 'youtube-embed', url: URL_HTTPS, caption: 'Rick roll', id: 'test-id' },
    });
  });

  it('omits the caption key entirely for caption-less embeds (like the old parseFenceBody)', async () => {
    const body = transform(await toLexical(URL_HTTPS));
    const [block] = body.root.children;
    expect(block !== undefined && 'fields' in block ? block.fields : undefined).not.toHaveProperty('caption');
  });
});
