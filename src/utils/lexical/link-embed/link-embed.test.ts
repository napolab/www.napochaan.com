import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { err, ok } from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';

import { blogEditorFeatures } from '@lib/payload/editor-features';

import { createLinkEmbedTransform, unescapeLinkCaption } from '.';

import type { LinkEmbedProvider, StandaloneLink } from '.';
import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical';
import type { Blog } from '@payload-types';

// 汎用層のテストは特定 provider(youtube 等)に依存しない fake provider で行う
// (skill: plugin は単体で、dispatcher は stub plugin でテスト可能に保つ)。
// fake は videos.example ドメインの動画 URL だけにマッチする。実 provider と同じく
// url 候補「全体」を URL として解釈する(トレーリングテキストや改行入りは非マッチ)。
const FAKE_URL = 'https://videos.example/watch/abc123';
const OTHER_URL = 'https://other.example/watch/abc123';
const FAKE_URL_SHAPE = /^https:\/\/videos\.example\/watch\/[A-Za-z0-9]+$/;

const fakeProvider: LinkEmbedProvider = {
  run(link) {
    if (!FAKE_URL_SHAPE.test(link.url)) return err(link);
    if (link.caption === '') return ok({ blockType: 'fake-embed', url: link.url });
    return ok({ blockType: 'fake-embed', url: link.url, caption: link.caption });
  },
};

// 実プロジェクトの editor features(blogEditorFeatures)から本物の editorConfig を組む。
// SanitizedConfig は BlocksFeature の sanitizeFields(ImageRow の media relationship)と
// link/upload feature の collection フィルタが読む最小限だけをスタブする。
const buildEditorConfig = async (): Promise<SanitizedServerEditorConfig> => {
  const config = { collections: [{ slug: 'media', admin: {}, upload: {}, fields: [] }], blocks: [] } as unknown as Parameters<typeof editorConfigFactory.fromFeatures>[0]['config'];

  return editorConfigFactory.fromFeatures({ config, features: blogEditorFeatures });
};

const toLexical = async (markdown: string): Promise<Blog['body']> => {
  const editorConfig = await buildEditorConfig();

  return convertMarkdownToLexical({ editorConfig, markdown }) as Blog['body'];
};

const transform = createLinkEmbedTransform([fakeProvider], () => 'test-id');

const blockOf = (url: string, caption?: string) => ({
  type: 'block',
  version: 2,
  format: '',
  fields: caption === undefined ? { blockType: 'fake-embed', url, id: 'test-id' } : { blockType: 'fake-embed', url, caption, id: 'test-id' },
});

// 手組みの lexical tree 用ヘルパ(characterization テストで実測済みの node 形状に合わせる)。
const textNode = (text: string) => ({ detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 });
const linkNode = (url: string, children: unknown[], type: 'autolink' | 'link' = 'link') => ({
  children,
  direction: null,
  format: '',
  indent: 0,
  type,
  version: 3,
  fields: { linkType: 'custom', newTab: false, url },
});
const paragraph = (children: unknown[]) => ({ children, direction: null, format: '', indent: 0, type: 'paragraph', version: 1, textFormat: 0, textStyle: '' });
const bodyOf = (children: unknown[]): Blog['body'] => ({ root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 } }) as Blog['body'];

// convertMarkdownToLexical が実際に生成する node 形状の characterization。
// この前提が崩れる(Payload のアップグレード等)と transform の入力仕様が変わるため、
// 変換テストとは別に形状そのものを固定しておく。
describe('characterization: what convertMarkdownToLexical produces (real editorConfig)', () => {
  it('a standalone bare URL becomes a root paragraph with a single text node (not an autolink)', async () => {
    const body = await toLexical(FAKE_URL);
    expect(body.root.children).toEqual([expect.objectContaining({ type: 'paragraph', children: [expect.objectContaining({ type: 'text', text: FAKE_URL })] })]);
  });

  it('a standalone [caption](url) becomes a root paragraph with a single link node carrying fields.url', async () => {
    const body = await toLexical(`[Watch this](${FAKE_URL})`);
    expect(body.root.children).toEqual([
      expect.objectContaining({
        type: 'paragraph',
        children: [expect.objectContaining({ type: 'link', fields: expect.objectContaining({ url: FAKE_URL }), children: [expect.objectContaining({ type: 'text', text: 'Watch this' })] })],
      }),
    ]);
  });

  it('the lexical importer keeps backslash escapes literally in the link text (no CommonMark unescape)', async () => {
    const body = await toLexical(`[a \\] b](${FAKE_URL})`);
    expect(body.root.children).toEqual([
      expect.objectContaining({ type: 'paragraph', children: [expect.objectContaining({ type: 'link', children: [expect.objectContaining({ text: 'a \\] b' })] })] }),
    ]);
  });
});

describe('link-embed transform: qualifying paragraphs (real markdown import)', () => {
  it('replaces a bare-URL paragraph with the provider block node (no caption)', async () => {
    const body = transform(await toLexical(FAKE_URL));
    expect(body.root.children).toEqual([blockOf(FAKE_URL)]);
  });

  it('replaces a [caption](url) paragraph with a captioned block node', async () => {
    const body = transform(await toLexical(`[Watch this](${FAKE_URL})`));
    expect(body.root.children).toEqual([blockOf(FAKE_URL, 'Watch this')]);
  });

  it('trims surrounding whitespace from a bare-URL text node', async () => {
    const body = transform(await toLexical(`${FAKE_URL}   `));
    expect(body.root.children).toEqual([blockOf(FAKE_URL)]);
  });

  it('tolerates whitespace-only sibling text nodes around the link (leading spaces on the line)', async () => {
    // 実測: 行頭スペースは paragraph 先頭に whitespace-only text node として残る。
    const body = transform(await toLexical(`  [cap](${FAKE_URL})`));
    expect(body.root.children).toEqual([blockOf(FAKE_URL, 'cap')]);
  });

  it('treats a link whose text equals its URL as caption-less (autolink-style writing)', async () => {
    const body = transform(await toLexical(`[${FAKE_URL}](${FAKE_URL})`));
    expect(body.root.children).toEqual([blockOf(FAKE_URL)]);
  });

  it('unescapes \\[ \\] in the caption before handing it to the provider', async () => {
    const body = transform(await toLexical(`[a \\] b](${FAKE_URL})`));
    expect(body.root.children).toEqual([blockOf(FAKE_URL, 'a ] b')]);
  });

  it('replaces multiple qualifying paragraphs in one document, leaving prose around them', async () => {
    const md = ['intro', '', FAKE_URL, '', `[cap](${FAKE_URL})`, '', 'outro'].join('\n');
    const body = transform(await toLexical(md));
    expect(body.root.children).toEqual([expect.objectContaining({ type: 'paragraph' }), blockOf(FAKE_URL), blockOf(FAKE_URL, 'cap'), expect.objectContaining({ type: 'paragraph' })]);
  });

  it('asks the injected id generator once per replaced block', async () => {
    const generateID = vi.fn(() => 'x');
    const body = createLinkEmbedTransform([fakeProvider], generateID)(await toLexical([FAKE_URL, '', FAKE_URL].join('\n')));
    expect(body.root.children).toHaveLength(2);
    expect(generateID).toHaveBeenCalledTimes(2);
  });
});

describe('link-embed transform: non-qualifying content stays untouched (real markdown import)', () => {
  const unchangedByTransform = async (markdown: string) => {
    const before = await toLexical(markdown);
    expect(transform(before).root.children).toEqual(before.root.children);
  };

  it('leaves an inline link inside a sentence untouched', async () => {
    await unchangedByTransform(`see [this](${FAKE_URL}) video`);
  });

  it('leaves a URL line with trailing text untouched', async () => {
    await unchangedByTransform(`${FAKE_URL} を見て`);
  });

  it('leaves a standalone link no provider claims untouched (passthrough, never rejected)', async () => {
    await unchangedByTransform(`[a video](${OTHER_URL})`);
  });

  it('leaves a bare URL no provider claims untouched', async () => {
    await unchangedByTransform(OTHER_URL);
  });

  it('leaves a plain prose paragraph untouched', async () => {
    await unchangedByTransform('こんにちは');
  });

  it('leaves a URL inside a code fence untouched (code nodes are not paragraphs)', async () => {
    await unchangedByTransform(['```typescript', `const url = '${FAKE_URL}';`, FAKE_URL, '```'].join('\n'));
  });

  it('leaves a quote-nested link paragraph untouched (only root-level paragraphs qualify)', async () => {
    await unchangedByTransform(`> [cap](${FAKE_URL})`);
  });

  it('leaves a soft-broken paragraph (URL line followed by text on the next line) untouched', async () => {
    // 1 段落内の linebreak node は許容しない — URL 単独段落だけが埋め込みになる。
    await unchangedByTransform([FAKE_URL, 'caption text'].join('\n'));
  });

  it('leaves an empty document untouched', async () => {
    await unchangedByTransform('');
  });
});

describe('link-embed transform: hand-built trees (editor-authored shapes)', () => {
  it('treats an autolink node like a link node (editor auto-linked URL)', () => {
    // Markdown import は autolink node を生成しないが、admin editor で URL を打つと
    // AutoLinkNode(type: 'autolink')になる。link と同じ規則で扱う。
    const body = transform(bodyOf([paragraph([linkNode(FAKE_URL, [textNode(FAKE_URL)], 'autolink')])]));
    expect(body.root.children).toEqual([blockOf(FAKE_URL)]);
  });

  it('concatenates multiple text children of the link into one caption', () => {
    const body = transform(bodyOf([paragraph([linkNode(FAKE_URL, [textNode('Watch '), textNode('this')])])]));
    expect(body.root.children).toEqual([blockOf(FAKE_URL, 'Watch this')]);
  });

  it('skips a link node whose fields carry no url (internal doc link)', () => {
    const node = { ...linkNode(FAKE_URL, [textNode('doc')]), fields: { linkType: 'internal', newTab: false } };
    const before = bodyOf([paragraph([node])]);
    expect(transform(before).root.children).toEqual(before.root.children);
  });

  it('skips a paragraph with a non-whitespace text sibling next to the link', () => {
    const before = bodyOf([paragraph([textNode('see '), linkNode(FAKE_URL, [textNode('cap')])])]);
    expect(transform(before).root.children).toEqual(before.root.children);
  });

  it('does not mutate the input tree (returns a new body)', () => {
    const before = bodyOf([paragraph([textNode(FAKE_URL)])]);
    const frozen = Object.freeze({ root: Object.freeze({ ...before.root, children: Object.freeze(before.root.children) }) }) as Blog['body'];
    const after = transform(frozen);
    expect(after).not.toBe(frozen);
    expect(after.root.children).toEqual([blockOf(FAKE_URL)]);
    expect(frozen.root.children).toEqual([paragraph([textNode(FAKE_URL)])]);
  });
});

describe('link-embed transform: provider registry dispatch', () => {
  it('dispatches in registration order — the first provider that returns ok wins', () => {
    const second: LinkEmbedProvider = { run: (link) => ok({ blockType: 'second-embed', url: link.url }) };
    const body = createLinkEmbedTransform([fakeProvider, second], () => 'test-id')(bodyOf([paragraph([textNode(FAKE_URL)])]));
    expect(body.root.children).toEqual([blockOf(FAKE_URL)]);
  });

  it('falls through err(link) to the next provider (skill contract: non-match = err(input))', () => {
    const seen: StandaloneLink[] = [];
    const rejectAll: LinkEmbedProvider = {
      run(link) {
        seen.push(link);
        return err(link);
      },
    };
    const body = createLinkEmbedTransform([rejectAll, fakeProvider], () => 'test-id')(bodyOf([paragraph([textNode(FAKE_URL)])]));
    expect(body.root.children).toEqual([blockOf(FAKE_URL)]);
    expect(seen).toEqual([{ url: FAKE_URL, caption: '' }]);
  });

  it('leaves the paragraph untouched when every provider errs (empty registry included)', () => {
    const before = bodyOf([paragraph([textNode(FAKE_URL)])]);
    expect(createLinkEmbedTransform([])(before).root.children).toEqual(before.root.children);
  });

  it('the default id generator produces a bson-objectid style 24-char hex (same kind as Payload)', () => {
    const body = createLinkEmbedTransform([fakeProvider])(bodyOf([paragraph([textNode(FAKE_URL)])]));
    const [block] = body.root.children;
    const fields = block !== undefined && 'fields' in block ? (block.fields as Record<string, unknown>) : undefined;
    expect(fields?.id).toMatch(/^[0-9a-f]{24}$/);
  });
});

describe('unescapeLinkCaption', () => {
  it('restores \\[ and \\] to bare brackets', () => {
    expect(unescapeLinkCaption('a \\[b\\] c')).toBe('a [b] c');
  });

  it('leaves other backslash sequences untouched', () => {
    expect(unescapeLinkCaption('a \\n b')).toBe('a \\n b');
  });
});
