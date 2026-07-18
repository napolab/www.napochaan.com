import { fenceBodyLines } from '../index';
import { parseYouTubeVideoID } from '../parse-url';

import type { McpBlockSupport } from '@lib/mcp/markdown/block-support';

// 全文書スキャン用のフェンス正規表現。src/blocks/youtube-embed/index.ts の 1 行アンカーの
// FENCE_START/FENCE_END と同じ構文を表す(構文の定義は block 側に集約)。
// `gm` フラグで各フェンスをキャプチャする — image-row の IMAGE_ROW_FENCE と同じ形。
const YOUTUBE_EMBED_FENCE = /^```youtube-embed\s*\n([\s\S]*?)^```\s*$/gm;

// 各 youtube-embed フェンスが「1 行目 URL(必須)+ 任意 2 行目 caption」であることを検証。
// 違反ごとに LLM 向け回復指示メッセージを返す。
const validateFences = (markdown: string): string[] =>
  [...markdown.matchAll(YOUTUBE_EMBED_FENCE)].flatMap((match) => {
    const inner = match[1] ?? '';
    const lines = fenceBodyLines(inner);
    if (lines.length === 0) return [`youtube-embed フェンスは 1 行目に YouTube 動画 URL が必要です。該当:\n${match[0]}`];
    if (lines.length > 2) return [`youtube-embed フェンスは 1 行目 URL、2 行目 caption(任意)の最大 2 行までです。該当:\n${match[0]}`];
    const [url] = lines;
    if (url === undefined || parseYouTubeVideoID(url) === undefined) {
      return [`youtube-embed フェンス 1 行目は YouTube の動画 URL(watch?v= / youtu.be / /embed/ / /shorts/)である必要があります。該当:\n${match[0]}`];
    }

    return [];
  });

// LLM 向けの構文説明。tool の bodyMarkdown 説明に集約される。
const syntaxHelp = [
  'YouTube 動画を埋め込む youtube-embed block(標準 Markdown ではない):',
  '```youtube-embed フェンスの中に 1 行目 = YouTube 動画 URL、2 行目 = caption(任意)。',
  'URL は https の watch?v= / youtu.be / /embed/ / /shorts/ のいずれか。例:',
  '```youtube-embed',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'キャプションテキスト',
  '```',
].join('\n');

// MCP の markdown registry(src/lib/mcp/markdown)に登録する youtube-embed の plugin。
// 埋め込みは URL しか参照しないため media id は列挙しない。
export const youtubeEmbedMcpSupport: McpBlockSupport = {
  blockType: 'youtube-embed',
  syntaxHelp,
  validateFences,
  extractMediaIDs: () => [],
};
