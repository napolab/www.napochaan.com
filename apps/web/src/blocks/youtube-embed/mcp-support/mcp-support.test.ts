import { describe, expect, it } from 'vitest';

import { youtubeEmbedProvider } from '../embed-provider';

import { youtubeEmbedMcpSupport } from '.';

const ID = 'dQw4w9WgXcQ';
const URL_HTTPS = `https://www.youtube.com/watch?v=${ID}`;

describe('youtubeEmbedMcpSupport.blockType', () => {
  it('is "youtube-embed"', () => {
    expect(youtubeEmbedMcpSupport.blockType).toBe('youtube-embed');
  });
});

// 旧内部フェンスは廃止済み。素通しすると Code block の customStartRegex が行頭に
// 部分一致して silent 破壊(language: "youtube" + code 先頭 "-embed" 混入)になるため、
// write 側では回復指示つきで明示的に拒否する(mcp-write-strict)。
describe('youtubeEmbedMcpSupport.validateFences', () => {
  it('rejects the retired ```youtube-embed fence with a recovery hint pointing to the link syntax', () => {
    const md = ['```youtube-embed', URL_HTTPS, '```'].join('\n');
    const errors = youtubeEmbedMcpSupport.validateFences(md);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('廃止');
    expect(errors[0]).toContain('[キャプション](URL)');
    expect(errors[0]).toContain('該当行');
  });

  it('reports one violation per retired fence', () => {
    const fence = ['```youtube-embed', URL_HTTPS, '```'].join('\n');
    expect(youtubeEmbedMcpSupport.validateFences(`${fence}\n\n${fence}`)).toHaveLength(2);
  });

  it('does not flag ordinary code fences (other plugins own those)', () => {
    expect(youtubeEmbedMcpSupport.validateFences('```typescript\nconst x = 1;\n```')).toEqual([]);
  });

  it('does not flag the standalone link syntax', () => {
    expect(youtubeEmbedMcpSupport.validateFences(`intro\n\n${URL_HTTPS}\n\noutro`)).toEqual([]);
  });
});

// 変換規則の網羅は provider 単体(../embed-provider/embed-provider.test.ts)と
// 汎用層(src/utils/lexical/link-embed/link-embed.test.ts)の責務。registry 経由で
// block node になるまでの smoke は src/lib/mcp/markdown/markdown.test.ts が持つ。
// ここでは plugin が provider そのもの(同一参照)を公開していることだけ確認する。
describe('youtubeEmbedMcpSupport.linkEmbedProvider', () => {
  it('exposes the youtube embed provider for the registry to compose', () => {
    expect(youtubeEmbedMcpSupport.linkEmbedProvider).toBe(youtubeEmbedProvider);
  });
});

describe('youtubeEmbedMcpSupport.extractMediaIDs', () => {
  it('never reports media ids (embed only references YouTube URLs)', () => {
    expect(youtubeEmbedMcpSupport.extractMediaIDs(`intro\n\n${URL_HTTPS}`)).toEqual([]);
  });
});

describe('youtubeEmbedMcpSupport.syntaxHelp', () => {
  it('documents the standalone link syntax with accepted URL shapes', () => {
    expect(youtubeEmbedMcpSupport.syntaxHelp).toContain('[キャプション](URL)');
    expect(youtubeEmbedMcpSupport.syntaxHelp).toContain('watch?v=');
    expect(youtubeEmbedMcpSupport.syntaxHelp).toContain('youtu.be');
    expect(youtubeEmbedMcpSupport.syntaxHelp).toContain('/embed/');
  });

  it('notes that inline links stay links', () => {
    expect(youtubeEmbedMcpSupport.syntaxHelp).toContain('インライン');
  });
});
